import { NextRequest, NextResponse } from "next/server";

/**
 * SSE-capable proxy from Next.js to FastAPI.
 *
 * All client code calls `/api/agents/<path>` — this route forwards to
 * `${FASTAPI_URL}/v1/agents/<path>`, keeping the Python URL and the
 * Anthropic key out of the browser.
 *
 * When MOCK_AGENTS=true, returns canned fixtures from `src/data/agent-cache/`
 * so offline development and live demos stay reliable.
 */

export const runtime = "nodejs";           // Needed for ReadableStream + fs fixtures
export const dynamic = "force-dynamic";    // Never cache agent responses

const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";
const MOCK_AGENTS = process.env.MOCK_AGENTS === "true";

async function forward(req: NextRequest, path: string[]) {
  const target = `${FASTAPI_URL}/v1/agents/${path.join("/")}`;
  const body = req.method === "POST" ? await req.text() : undefined;

  if (MOCK_AGENTS) {
    // In mock mode we return a minimal SSE stream so the UI still works.
    // Real fixture loading is added in P1 (keyed by preset hash).
    return mockStream(path.join("/"));
  }

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        Accept: req.headers.get("accept") ?? "application/json",
      },
      body,
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
  } catch (err) {
    return NextResponse.json(
      {
        error: "agent_proxy_unavailable",
        detail: err instanceof Error ? err.message : String(err),
        hint: "Check FASTAPI_URL env var or set MOCK_AGENTS=true for offline dev.",
      },
      { status: 502 },
    );
  }
}

function mockStream(path: string): NextResponse {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };
      send("phase", { phase: "mock", agent: "system", path });
      await new Promise((r) => setTimeout(r, 150));
      send("token", { agent: "system", delta: "Mock agent response — set MOCK_AGENTS=false to hit FastAPI." });
      await new Promise((r) => setTimeout(r, 100));
      send("done", { ok: true, mock: true, path });
      controller.close();
    },
  });
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
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
