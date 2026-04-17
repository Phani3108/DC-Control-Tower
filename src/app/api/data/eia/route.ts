import { NextRequest, NextResponse } from "next/server";
import { getBucket } from "@/lib/shared/rate-limit";

/**
 * US EIA Open Data API v2 proxy.
 *
 * Requires `EIA_API_KEY`. Falls back to a static US national average
 * if the key is absent or the upstream call fails.
 */

export const runtime = "nodejs";
export const revalidate = 86400;

const BUCKET = { maxTokens: 60, refillPerMinute: 60 };

const FALLBACK = {
  source: "snapshot" as const,
  retrieved: "2026-04-17",
  regionalUSDPerMWh: {
    "US-NATIONAL": 85,
    "US-PJM": 82,
    "US-ERCOT": 74,
    "US-CAISO": 93,
  },
};

export async function GET(req: NextRequest) {
  const bucket = getBucket("eia", BUCKET);
  const EIA_API_KEY = process.env.EIA_API_KEY;
  const region = req.nextUrl.searchParams.get("region") ?? "US-NATIONAL";

  if (!EIA_API_KEY || !bucket.take()) {
    return NextResponse.json(
      {
        source: "snapshot",
        retrieved: FALLBACK.retrieved,
        region,
        priceUSDPerMWh: FALLBACK.regionalUSDPerMWh[region as keyof typeof FALLBACK.regionalUSDPerMWh] ?? FALLBACK.regionalUSDPerMWh["US-NATIONAL"],
      },
      { headers: { "Cache-Control": "s-maxage=86400", "x-source": "snapshot" } },
    );
  }

  try {
    // Representative EIA endpoint — shape may need adjustment against the real schema
    const url = new URL("https://api.eia.gov/v2/electricity/retail-sales/data/");
    url.searchParams.set("api_key", EIA_API_KEY);
    url.searchParams.set("frequency", "monthly");
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`EIA ${res.status}`);
    const data = await res.json();
    return NextResponse.json(
      {
        source: "live",
        retrieved: new Date().toISOString().slice(0, 10),
        region,
        raw: data,
      },
      { headers: { "Cache-Control": "s-maxage=86400", "x-source": "live" } },
    );
  } catch {
    return NextResponse.json(
      {
        source: "snapshot",
        retrieved: FALLBACK.retrieved,
        region,
        priceUSDPerMWh: FALLBACK.regionalUSDPerMWh[region as keyof typeof FALLBACK.regionalUSDPerMWh] ?? FALLBACK.regionalUSDPerMWh["US-NATIONAL"],
      },
      { headers: { "Cache-Control": "s-maxage=86400", "x-source": "snapshot-fallback" } },
    );
  }
}
