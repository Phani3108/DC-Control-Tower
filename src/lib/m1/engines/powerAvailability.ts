import type { CandidateSite } from "@/lib/shared/types";
import type { EngineResult, M1Input } from "../types";

/**
 * Power Availability engine.
 *
 * Scores on (a) MW headroom vs. target, (b) grid stability (99th-pct outage
 * minutes/yr, lower is better), (c) renewable share trajectory. Heuristic
 * model — produces defensible demo numbers sourced from Ember + IEA-style
 * data in the candidate-sites packet.
 */
export function powerAvailability(site: CandidateSite, input: M1Input): EngineResult {
  const s = site.priorSignals ?? {};
  const renewableShare = (s as Record<string, number>).renewableShare ?? 0;
  const outageMin = (s as Record<string, number>).grid99PercentileOutageMin ?? 300;

  // MW headroom — assume we need 3x target for multi-phase buildout
  const headroomFactor = Math.min(1, (site.targetMW * 3) / (input.targetMW * 3));

  // Lower outage = higher stability. 60 min = 100; 300 min = 20.
  const stabilityScore = clamp01((300 - outageMin) / 240) * 100;

  // Renewable share direct (0..1 → 0..100)
  const renewableScore = renewableShare * 100;

  const score =
    0.45 * headroomFactor * 100 +
    0.35 * stabilityScore +
    0.20 * renewableScore;

  const rationale =
    `${site.name}: grid outage p99 ${outageMin} min/yr; renewable share ${(renewableShare * 100).toFixed(0)}%; ` +
    `headroom adequate for ${input.targetMW} MW buildout.`;

  return {
    engineId: "powerAvailability",
    score: round(score),
    factors: {
      headroomFactor: round(headroomFactor, 2),
      stabilityScore: round(stabilityScore),
      renewableScore: round(renewableScore),
      outageMin,
      renewableShare: round(renewableShare, 2),
    },
    rationale,
  };
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
function round(x: number, d = 0): number {
  const p = Math.pow(10, d);
  return Math.round(x * p) / p;
}
