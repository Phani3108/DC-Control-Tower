import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import nodePath from "node:path";
import { getRuntimeIntegration } from "@/lib/integrations/runtime";

/**
 * SSE-capable proxy from Next.js to FastAPI.
 *
 * All client code calls `/api/agents/<path>` — this route forwards to
 * `${FASTAPI_URL}/v1/agents/<path>`, keeping the Python URL and the
 * Anthropic key out of the browser.
 *
 * Offline / demo behavior:
 *  - MOCK_AGENTS=true            → never hit FastAPI; replay cache fixtures by preset_id.
 *  - FastAPI unreachable (any err)→ auto-fallback to cache replay so live demos stay safe.
 *  - No cache match               → minimal generic SSE stub (was the only behavior before).
 *  - rfp-extract is non-SSE; returns a stubbed workload when unreachable.
 */

export const runtime = "nodejs";           // Needed for ReadableStream + fs fixtures
export const dynamic = "force-dynamic";    // Never cache agent responses

const MOCK_AGENTS = process.env.MOCK_AGENTS === "true";
const CACHE_DIR = nodePath.join(process.cwd(), "src", "data", "agent-cache");

interface CachedFrame {
  event: string;
  data: unknown;
}

async function readCacheByPreset(presetId: string): Promise<CachedFrame[] | null> {
  try {
    const files = await fs.readdir(CACHE_DIR);
    const match = files
      .filter((f) => f.startsWith(`${presetId}-`) && f.endsWith(".json"))
      .sort();
    const file = match[match.length - 1];
    if (!file) return null;
    const raw = await fs.readFile(nodePath.join(CACHE_DIR, file), "utf8");
    const parsed = JSON.parse(raw) as { frames?: CachedFrame[] };
    return Array.isArray(parsed.frames) ? parsed.frames : null;
  } catch {
    return null;
  }
}

function extractPresetId(bodyText: string | undefined): string | null {
  if (!bodyText) return null;
  try {
    const obj = JSON.parse(bodyText) as { preset_id?: unknown; presetId?: unknown };
    const id = obj.preset_id ?? obj.presetId;
    return typeof id === "string" && id.length > 0 ? id : null;
  } catch {
    return null;
  }
}

function sseFromFrames(frames: CachedFrame[]): NextResponse {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (const f of frames) {
        controller.enqueue(
          encoder.encode(`event: ${f.event}\ndata: ${JSON.stringify(f.data)}\n\n`),
        );
        await new Promise((r) => setTimeout(r, 25));
      }
      controller.close();
    },
  });
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Mock-Source": "cache-replay",
    },
  });
}

function genericMockSSE(routePath: string): NextResponse {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };
      send("phase", { phase: "mock", agent: "system", path: routePath });
      await new Promise((r) => setTimeout(r, 60));
      send("token", { agent: "system", delta: "Mock agent — no preset_id and no cache fixture matched." });
      await new Promise((r) => setTimeout(r, 60));
      send("done", { ok: true, mock: true, path: routePath });
      controller.close();
    },
  });
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Mock-Source": "generic-stub",
    },
  });
}

function rfpExtractStub(): NextResponse {
  return NextResponse.json(
    {
      workload: {
        shape: "training",
        gpu: "B200",
        clusterMW: 40,
        latencySLAms: 20,
        customerGeography: "US",
        dataGeography: "US",
        budgetUSDPerMWhMax: 140,
        sustainability: { pueMax: 1.35, renewableMin: 0.6 },
      },
    },
    { headers: { "X-Mock-Source": "rfp-extract-stub" } },
  );
}

async function offlineResponse(routePath: string, bodyText: string | undefined) {
  if (routePath === "rfp-extract") return rfpExtractStub();
  const presetId = extractPresetId(bodyText);
  if (presetId) {
    const frames = await readCacheByPreset(presetId);
    if (frames && frames.length > 0) return sseFromFrames(frames);
  }
  return genericMockSSE(routePath);
}

async function forward(req: NextRequest, segments: string[]) {
  const fastapi = await getRuntimeIntegration("fastapi-agents");
  const fastapiUrl = fastapi?.activeUrl ?? process.env.FASTAPI_URL ?? "http://localhost:8000";
  const routePath = segments.join("/");
  const target = `${fastapiUrl}/v1/agents/${routePath}`;
  const bodyText = req.method === "POST" ? await req.text() : undefined;

  if (MOCK_AGENTS) {
    return offlineResponse(routePath, bodyText);
  }

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        Accept: req.headers.get("accept") ?? "application/json",
      },
      body: bodyText,
      // @ts-expect-error — Node fetch supports duplex for streaming bodies
      duplex: "half",
    });

    // SSE passthrough: stream the body back unchanged.
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") ?? "application/json",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch {
    // Auto-fallback: FastAPI unreachable → use cache replay so demos never break.
    return offlineResponse(routePath, bodyText);
  }
}

type RouteCtx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return forward(req, path);
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
