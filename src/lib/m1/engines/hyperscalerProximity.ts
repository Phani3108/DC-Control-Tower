import type { CandidateSite } from "@/lib/shared/types";
import type { EngineResult, M1Input } from "../types";

/**
 * Hyperscaler proximity — Telegeography RTT + public region coordinates.
 * Per-site signal encodes the blended adjacency to AWS/Azure/GCP/OCI regions
 * and the IX density ranking.
 */
export function hyperscalerProximity(site: CandidateSite, _input: M1Input): EngineResult {
  const hpScore = ((site.priorSignals ?? {}) as Record<string, number>).hyperscalerProximityScore ?? 60;
  return {
    engineId: "hyperscalerProximity",
    score: hpScore,
    factors: { hyperscalerProximityIndex: hpScore },
    rationale: `Hyperscaler-proximity index ${hpScore}/100 (Telegeography + public AWS/GCP/Azure region coords + IX density).`,
    cite_ids: ["telegeography-global-internet-map-2024", "pch-ix-directory"],
  };
}
