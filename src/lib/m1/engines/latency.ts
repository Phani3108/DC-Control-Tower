import type { CandidateSite } from "@/lib/shared/types";
import type { EngineResult, M1Input } from "../types";

/**
 * Latency engine.
 *
 * Scores on round-trip latency to the nearest major IX peering point
 * (Packet Clearing House reference data). Inference and edge workloads
 * weight this highest; hyperscale training is less sensitive.
 */
export function latency(site: CandidateSite, input: M1Input): EngineResult {
  const s = site.priorSignals ?? {};
  const rtMs = (s as Record<string, number>).latencyToBigIXms ?? 10;

  // Sub-2ms → 100; 10ms → 20.
  const base = Math.max(0, Math.min(100, 100 - (rtMs - 2) * 10));

  // Training is latency-tolerant; give a floor bump
  const bumped = input.workloadProfile === "hyperscale-training" ? Math.max(base, 55) : base;

  const rationale =
    `${site.name}: RTT ${rtMs.toFixed(1)} ms to nearest Tier-1 IX; ` +
    `${input.workloadProfile === "hyperscale-training" ? "training is latency-tolerant" : "inference/edge latency matters"}.`;

  return {
    engineId: "latency",
    score: round(bumped),
    factors: {
      rttMsToNearestIX: rtMs,
      workloadProfile: input.workloadProfile,
    },
    rationale,
  };
}

function round(x: number, d = 0): number {
  const p = Math.pow(10, d);
  return Math.round(x * p) / p;
}
