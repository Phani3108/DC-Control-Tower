import { NextRequest, NextResponse } from "next/server";
import snapshot from "@/data/snapshots/iea-weo-2024.json";

/**
 * IEA WEO electricity-price proxy.
 *
 * IEA WEO is published annually; we ship the snapshot and refresh yearly.
 * No public API key is generally available for WEO bulk data, so this
 * route effectively always serves the snapshot.
 */

export const runtime = "nodejs";
export const revalidate = 604800;  // 7d

export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get("country");
  const data = country
    ? {
        source: "snapshot",
        retrieved: snapshot.retrieved,
        scenario: snapshot.scenario,
        country,
        ...(snapshot.prices[country as keyof typeof snapshot.prices] ?? {}),
      }
    : {
        source: "snapshot",
        retrieved: snapshot.retrieved,
        scenario: snapshot.scenario,
        prices: snapshot.prices,
      };
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "s-maxage=604800, stale-while-revalidate=86400",
      "x-source": "snapshot",
    },
  });
}
