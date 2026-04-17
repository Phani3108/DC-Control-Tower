import type { CandidateSite } from "@/lib/shared/types";
import type { EngineResult, M1Input } from "../types";

/**
 * Latency — Telegeography Global Internet Map + PCH peering data.
 *
 * Training is largely latency-tolerant (bulk data-parallel collectives);
 * inference + edge workloads weight latency heavily.
 */
export function latency(site: CandidateSite, input: M1Input): EngineResult {
  const s = (site.priorSignals ?? {}) as Record<string, number>;
  const rtMs = s.latencyToBigIXms ?? 10;

  const base = Math.max(0, Math.min(100, 100 - (rtMs - 2) * 10));
  const bumped = input.workloadProfile === "hyperscale-training" ? Math.max(base, 55) : base;

  return {
    engineId: "latency",
    score: Math.round(bumped * 10) / 10,
    factors: {
      rttMsToNearestIX: rtMs,
      workloadProfile: input.workloadProfile,
    },
    rationale: `RTT ${rtMs.toFixed(1)} ms to Tier-1 IX; ${input.workloadProfile === "hyperscale-training" ? "training tolerant" : "latency-sensitive workload"}.`,
    cite_ids: ["telegeography-global-internet-map-2024", "pch-ix-directory"],
  };
}
