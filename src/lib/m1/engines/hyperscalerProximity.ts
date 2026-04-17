import type { CandidateSite } from "@/lib/shared/types";
import type { EngineResult, M1Input } from "../types";

/**
 * Hyperscaler proximity engine.
 *
 * Proxy for how attractive the site is to AWS / Azure / GCP / Oracle as
 * a colocation neighbor, and to customers doing cross-region replication.
 * High-density IX regions (Singapore / Johor, Virginia, Frankfurt) get the
 * biggest scores.
 */
export function hyperscalerProximity(site: CandidateSite, _input: M1Input): EngineResult {
  const s = site.priorSignals ?? {};
  const hpScore = (s as Record<string, number>).hyperscalerProximityScore ?? 60;

  const rationale =
    `${site.name}: hyperscaler-proximity index ${hpScore}/100 ` +
    `(adjacency to AWS/Azure/GCP regions + Tier-1 IX density).`;

  return {
    engineId: "hyperscalerProximity",
    score: hpScore,
    factors: { hyperscalerProximityIndex: hpScore },
    rationale,
  };
}
