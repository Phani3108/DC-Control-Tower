import { NextRequest, NextResponse } from "next/server";
import { getBucket } from "@/lib/shared/rate-limit";
import snapshot from "@/data/snapshots/ember-2026-04.json";
import { getRuntimeIntegration } from "@/lib/integrations/runtime";

/**
 * Ember Electricity Data proxy.
 *
 * Flow: rate-limit bucket → (if upstream configured) proxy to Ember API
 *       → otherwise serve the monthly snapshot with x-source: snapshot.
 *
 * The response always uses the same shape so downstream engines don't care
 * which path served it.
 */

export const runtime = "nodejs";
export const revalidate = 86400;   // 24h ISR

const BUCKET = { maxTokens: 60, refillPerMinute: 60 };

interface Payload {
  source: "live" | "snapshot";
  retrieved: string;
  scenario?: string;
  countries: Record<string, { renewableShare: number; gridCarbonIntensity_gCO2_per_kWh: number; year: number }>;
}

export async function GET(req: NextRequest) {
  const bucket = getBucket("ember", BUCKET);
  const country = req.nextUrl.searchParams.get("country");

  const integration = await getRuntimeIntegration("ember-data");
  const EMBER_API_KEY = integration?.apiKey ?? process.env.EMBER_API_KEY;
  const emberBase = integration?.activeUrl ?? "https://api.ember-energy.org";

  // Fast path — always have the snapshot ready.
  const baseline: Payload = {
    source: "snapshot",
    retrieved: snapshot.retrieved,
    countries: snapshot.countries,
  };

  // If no API key or bucket empty, return snapshot immediately.
  if (!EMBER_API_KEY || !bucket.take()) {
    return respond(baseline, country, "snapshot-fallback");
  }

  try {
    // Best-effort live fetch. If Ember's endpoint shape changes we still fall back.
    const url = new URL("/v1/electricity", emberBase);
    if (country) url.searchParams.set("country", country);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${EMBER_API_KEY}` },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return respond(baseline, country, "upstream-non-ok");
    const live = (await res.json()) as Partial<Payload>;
    const merged: Payload = {
      source: "live",
      retrieved: new Date().toISOString().slice(0, 10),
      countries: { ...baseline.countries, ...(live.countries ?? {}) },
    };
    return respond(merged, country, "live");
  } catch {
    return respond(baseline, country, "fetch-error");
  }
}

function respond(p: Payload, country: string | null, why: string): NextResponse {
  const data = country ? { source: p.source, retrieved: p.retrieved, country, ...(p.countries[country] ?? {}) } : p;
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "s-maxage=86400, stale-while-revalidate=3600",
      "x-source": p.source,
      "x-reason": why,
    },
  });
}
