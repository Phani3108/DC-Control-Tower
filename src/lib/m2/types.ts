/**
 * M2 · Capacity Matcher — types.
 *
 * Takes a workload profile (from free-text RFP or a structured form) and
 * ranks DAMAC facilities by fit. Produces a 6-layer cost model, SLA draft,
 * competitor comparison, and — via the Opus proposal writer — a customer-
 * ready proposal brief.
 */

import type { GPUSku, WorkloadShape } from "@/lib/shared/types";

export interface M2Workload {
  shape: WorkloadShape;
  gpu: GPUSku;
  clusterMW: number;
  rampMW?: number;                // 24-month ramp target (optional)
  latencySLAms?: number;
  customerGeography?: string;
  dataGeography?: string;
  sustainability?: {
    pueMax?: number;
    renewableMin?: number;
  };
  budgetUSDPerMWhMax?: number;
}

export interface M2Input {
  rfpText?: string;               // optional — used for agent extraction
  workload: M2Workload;
  candidateFacilityIds?: string[];
}

export interface FacilityFit {
  facilityId: string;
  facilityName: string;
  country: string;
  fitScore: number;               // 0..100
  factors: {
    powerFit: number;
    rackDensityFit: number;
    latencyFit: number;
    coolingFit: number;
    sustainabilityFit: number;
    budgetFit: number;
  };
  recommendedPhasing: string;     // e.g. "Phase 1: 20 MW in Q3-2026, Phase 2: 20 MW in Q1-2027"
  rationale: string;
  rackCount: number;              // estimated # racks for this workload
  kWPerRack: number;
  coolingMode: "air" | "liquid-dlc" | "hybrid" | "immersion";
  blockers: string[];
}

// 6-layer cost model (reusing the GenAICostCalulator shape, adapted to DC colo)
export interface CostLayer {
  layer: "power" | "cooling" | "gpu-amortization" | "real-estate" | "network" | "staff-ops";
  usdPerMonth: number;
  breakdown: Record<string, number>;
}

export interface CostBreakdown {
  totalUSDPerMonth: number;
  totalUSDPerMWh: number;         // blended
  layers: CostLayer[];
  threeYearUSDm: number;
}

export interface CompetitorComparison {
  competitorId: string;
  competitorName: string;
  pricePerMWhUSDBand: [number, number];
  priceDeltaPctVsDAMAC: number;    // positive = DAMAC cheaper
  notes: string;
}

export interface SLADraft {
  availabilityTarget: string;      // e.g. "99.982% (Tier IV)"
  powerRedundancy: string;
  coolingRedundancy: string;
  networkRedundancy: string;
  creditsSchedule: string;
  incidentResponseMin: number;
}

export interface M2Output {
  input: M2Input;
  fits: FacilityFit[];
  primaryFacilityId: string | null;
  costs: Record<string, CostBreakdown>;    // keyed by facilityId
  sla: SLADraft;
  comparisons: CompetitorComparison[];
  generatedAt: string;
}
