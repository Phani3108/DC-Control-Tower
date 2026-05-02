import type { CandidateSite } from "@/lib/shared/types";
import type { EngineResult, M1Input } from "../types";

/**
 * Incentives + Permitting — DCD Regulatory Tracker P50/P90.
 */
export function incentives(site: CandidateSite, _input: M1Input): EngineResult {
  void _input;
  const s = (site.priorSignals ?? {}) as Record<string, number>;
  const incScore = s.incentivesScore ?? 60;
  const p50 = s.permittingMonthsP50 ?? 24;
  const p90 = s.permittingMonthsP90 ?? 36;

  const permitScore = Math.max(0, Math.min(100, 100 - (p50 - 12) * 3.3));
  const uncertaintyPenalty = Math.max(0, (p90 - p50) - 6) * 0.6;

  const score = 0.55 * incScore + 0.35 * permitScore - uncertaintyPenalty;

  return {
    engineId: "incentives",
    score: Math.max(0, Math.round(score * 10) / 10),
    factors: {
      incentivesIndex: incScore,
      permittingMonthsP50: p50,
      permittingMonthsP90: p90,
      uncertaintyPenalty: Math.round(uncertaintyPenalty * 10) / 10,
    },
    rationale: `${site.name}: incentives ${incScore}/100, permitting P50 ${p50} mo / P90 ${p90} mo (DCD tracker).`,
    cite_ids: ["dcd-regulatory-tracker"],
  };
}
