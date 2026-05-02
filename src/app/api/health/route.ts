import { NextResponse } from "next/server";
import { getRuntimeIntegration } from "@/lib/integrations/runtime";

/**
 * Health endpoint — reports both the Next.js tier and the FastAPI tier
 * so the footer HealthBadge can show a two-dot status indicator.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HealthResult {
  web: { status: "ok"; version: string; uptimeSec: number };
  agents: { status: "ok" | "degraded" | "down"; url?: string; detail?: string };
  timestamp: string;
}

const START_TS = Date.now();

export async function GET(): Promise<NextResponse<HealthResult>> {
  const now = new Date();
  const fastapi = await getRuntimeIntegration("fastapi-agents");
  const agentsUrl = fastapi?.activeUrl ?? process.env.FASTAPI_URL ?? "http://localhost:8000";
  let agents: HealthResult["agents"] = { status: "down", url: agentsUrl };

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(`${agentsUrl}/v1/health`, { signal: ctrl.signal, cache: "no-store" });
    clearTimeout(t);
    if (res.ok) {
      agents = { status: "ok", url: agentsUrl };
    } else {
      agents = { status: "degraded", url: agentsUrl, detail: `upstream ${res.status}` };
    }
  } catch (e) {
    agents = { status: "down", url: agentsUrl, detail: e instanceof Error ? e.message : String(e) };
  }

  return NextResponse.json({
    web: {
      status: "ok",
      version: "1.0.0",
      uptimeSec: Math.round((Date.now() - START_TS) / 1000),
    },
    agents,
    timestamp: now.toISOString(),
  });
}
