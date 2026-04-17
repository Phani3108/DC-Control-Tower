/**
 * M1 · Site Intelligence — types.
 *
 * The 10 engines each return a normalized 0..100 score plus structured
 * `factors` (per-driver numbers) and a short human-readable `rationale`.
 * These are aggregated into a per-site `SiteScorecard`, then ranked by
 * a weighted overall score. The ICSynthesis agent takes the aggregated
 * scorecards and produces the final IC memo.
 */

import type { CandidateSite } from "@/lib/shared/types";

export interface M1Input {
  targetMW: number;
  region: "ME" | "EU" | "APAC" | "US";
  workloadProfile: "hyperscale-training" | "sovereign-inference" | "edge";
  candidateSiteIds: string[];
  weights?: Partial<EngineWeights>;
}

export type EngineId =
  | "powerAvailability"
  | "powerCost"
  | "cooling"
  | "latency"
  | "sovereignty"
  | "seismicClimate"
  | "incentives"
  | "talent"
  | "financeRisk"
  | "hyperscalerProximity";

export type EngineWeights = Record<EngineId, number>;

export interface EngineResult {
  engineId: EngineId;
  score: number;                  // 0..100
  factors: Record<string, number | string | boolean>;
  rationale: string;              // ≤240 chars, human-readable
  /** v1.0 — which citation ids back this engine's numbers. */
  cite_ids: string[];
}

export interface SiteScorecard {
  site: CandidateSite;
  engineResults: Record<EngineId, EngineResult>;
  overallScore: number;           // 0..100, weighted mean
  rank: number;                   // 1-based
  tco5yrUSDm: number;             // 5-year TCO, USD millions
  blockingFlags: string[];        // blocking-severity issues (e.g. sovereignty blocking)
}

export interface M1Output {
  input: M1Input;
  scorecards: SiteScorecard[];
  weightsUsed: EngineWeights;
  topSite: string;
  runnerUp: string;
  generatedAt: string;            // ISO
}

// ---- Weights per workload profile ---------------------------------------
// Hand-tuned for plausibility. These are defensible in an IC memo — the
// balance between cost, latency, sovereignty, and climate risk shifts
// meaningfully across profiles.
export const DEFAULT_WEIGHTS: Record<M1Input["workloadProfile"], EngineWeights> = {
  "hyperscale-training": {
    powerAvailability: 0.18,
    powerCost: 0.16,
    cooling: 0.12,
    latency: 0.06,
    sovereignty: 0.08,
    seismicClimate: 0.08,
    incentives: 0.10,
    talent: 0.06,
    financeRisk: 0.06,
    hyperscalerProximity: 0.10,
  },
  "sovereign-inference": {
    powerAvailability: 0.10,
    powerCost: 0.08,
    cooling: 0.06,
    latency: 0.16,
    sovereignty: 0.22,
    seismicClimate: 0.06,
    incentives: 0.06,
    talent: 0.08,
    financeRisk: 0.10,
    hyperscalerProximity: 0.08,
  },
  edge: {
    powerAvailability: 0.08,
    powerCost: 0.08,
    cooling: 0.06,
    latency: 0.22,
    sovereignty: 0.10,
    seismicClimate: 0.06,
    incentives: 0.08,
    talent: 0.08,
    financeRisk: 0.10,
    hyperscalerProximity: 0.14,
  },
};
