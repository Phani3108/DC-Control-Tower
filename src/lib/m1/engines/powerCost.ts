import type { CandidateSite } from "@/lib/shared/types";
import type { EngineResult, M1Input } from "../types";

/**
 * Power Cost engine.
 *
 * Scores on wholesale electricity price ($/MWh). Includes a rough 10-yr
 * forecast using a per-country escalator (demo-grade; real engine would
 * fetch IEA + EIA trajectories).
 *
 * Scoring: $60/MWh → 100, $140/MWh → 20.
 */

const ESCALATOR_PCT_PER_YR: Record<string, number> = {
  MY: 2.8,
  ID: 3.2,
  TH: 3.6,
  SA: 1.8,
  AE: 1.9,
  ES: 4.2,
  GR: 4.5,
  TR: 5.2,
  US: 3.1,
};

export function powerCost(site: CandidateSite, _input: M1Input): EngineResult {
  const s = site.priorSignals ?? {};
  const spot = (s as Record<string, number>).avgPowerCostUSDPerMWh ?? 120;
  const escalator = ESCALATOR_PCT_PER_YR[site.countryCode] ?? 3.5;

  // Linear scoring — $60→100, $140→20
  const score = Math.max(0, Math.min(100, 100 - ((spot - 60) / 80) * 80));

  // 10-yr forecast at compound escalation
  const yr10 = spot * Math.pow(1 + escalator / 100, 10);

  const rationale =
    `${site.name}: current ~$${spot}/MWh wholesale; ${escalator.toFixed(1)}%/yr escalator ` +
    `→ ~$${yr10.toFixed(0)}/MWh in 10 yr.`;

  return {
    engineId: "powerCost",
    score: round(score),
    factors: {
      spotUSDPerMWh: spot,
      escalatorPct: escalator,
      forecastYr10USDPerMWh: round(yr10),
      country: site.countryCode,
    },
    rationale,
  };
}

function round(x: number, d = 0): number {
  const p = Math.pow(10, d);
  return Math.round(x * p) / p;
}
