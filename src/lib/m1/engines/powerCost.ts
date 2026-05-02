import type { CandidateSite } from "@/lib/shared/types";
import type { EngineResult, M1Input } from "../types";
import ieaSnapshot from "@/data/snapshots/iea-weo-2024.json";

/**
 * Power Cost engine — IEA WEO 2024 APS trajectories.
 *
 * Serves the IEA WEO snapshot directly (live fetch optional via /api/data/iea).
 * Score maps spot price to 0..100 on a linear band anchored at $60 → 100 and
 * $150 → 20. Forecasts 10 yr out using the country-specific CAGR from WEO.
 */

interface IEAPrice { spot: number; cagr10yr: number }
interface IEASnapshot { prices: Record<string, IEAPrice> }

const PRICES = (ieaSnapshot as unknown as IEASnapshot).prices;

export function powerCost(site: CandidateSite, _input: M1Input): EngineResult {
  void _input;
  const record = PRICES[site.countryCode] ?? { spot: 130, cagr10yr: 0.035 };
  const spot = record.spot;
  const cagr = record.cagr10yr;

  const score = Math.max(0, Math.min(100, 100 - ((spot - 60) / 90) * 80));
  const yr10 = spot * Math.pow(1 + cagr, 10);

  const rationale =
    `IEA WEO 2024 APS: $${spot}/MWh spot; ${(cagr * 100).toFixed(1)}%/yr CAGR → ` +
    `~$${yr10.toFixed(0)}/MWh in 10 yr.`;

  return {
    engineId: "powerCost",
    score: Math.round(score * 10) / 10,
    factors: {
      spotUSDPerMWh: spot,
      cagrPct: Math.round(cagr * 1000) / 10,
      forecastYr10USDPerMWh: Math.round(yr10),
      country: site.countryCode,
      scenario: "APS",
    },
    rationale,
    cite_ids: ["iea-weo-2024", "eia-open-data"],
  };
}
