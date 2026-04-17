import type { CandidateSite } from "@/lib/shared/types";
import type { EngineResult, M1Input } from "../types";

/**
 * Tax Incentives + Permitting engine.
 *
 * Combines (a) jurisdiction-specific incentive score (KSA NEOM, Indonesia KEK
 * special economic zone, Greek investment law, Thailand EEC, US IRA/CHIPS)
 * with (b) permitting timeline (shorter is better).
 */
export function incentives(site: CandidateSite, _input: M1Input): EngineResult {
  const s = site.priorSignals ?? {};
  const incScore = (s as Record<string, number>).incentivesScore ?? 60;
  const permitting = (s as Record<string, number>).permittingMonths ?? 24;

  // 12 months → 100, 36 months → 20
  const permitScore = Math.max(0, Math.min(100, 100 - (permitting - 12) * 3.3));

  const score = 0.65 * incScore + 0.35 * permitScore;

  const rationale =
    `${site.name}: incentives index ${incScore}/100; ` +
    `~${permitting} months permitting path.`;

  return {
    engineId: "incentives",
    score: round(score),
    factors: {
      incentivesIndex: incScore,
      permittingMonths: permitting,
      permitScore: round(permitScore),
    },
    rationale,
  };
}

function round(x: number, d = 0): number {
  const p = Math.pow(10, d);
  return Math.round(x * p) / p;
}
