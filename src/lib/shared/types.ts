/**
 * Shared types used across all four modules.
 *
 * v1.0 adds `cite_ids` everywhere numbers flow — agents, engines, data records.
 */

// ---------------------------------------------------------------------------
// Facilities & sites
// ---------------------------------------------------------------------------

export type FacilityStatus = "operational" | "under-construction" | "planned" | "announced";

export interface DAMACFacility {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  region: "ME" | "EU" | "APAC" | "US" | "AFRICA";
  city: string;
  coordinates: [number, number];
  capacityMW: number;
  operationalMW: number;
  tier: "III" | "IV";
  /** Design PUE as published/targeted. */
  puE: number;
  /** Realistic first-year operational PUE (per Uptime Global Survey 2024). */
  puERampYear1?: number;
  status: FacilityStatus;
  commissioningDate?: string;
  coolingType: "air" | "liquid-dlc" | "immersion" | "hybrid";
  maxRackDensityKW: number;
  /** Market-specific retail colocation rack price (from CBRE H2 2025). */
  rackUSDPerMonth?: number;
  /** Legacy — preserved for back-compat with v0.1 data file. */
  sourceUrls?: string[];
  /** v1.0 citation ids. Required on every new record. */
  cite_ids: string[];
}

export interface CandidateSite {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  coordinates: [number, number];
  targetMW: number;
  priorSignals?: Partial<{
    /** Wholesale industrial electricity price USD/MWh (IEA/EIA). */
    avgPowerCostUSDPerMWh: number;
    /** Renewable share 0..1 (Ember API snapshot). */
    renewableShare: number;
    /** Year the renewable share reading applies to. */
    renewableShareYear: number;
    /** Grid operator name (for transparency). */
    gridOperator: string;
    /** Firm grid capacity at the POI, MW. */
    firmCapacityMW: number;
    /** N-1 contingency reserve MW (NERC/FERC framework). */
    n1ContingencyMW: number;
    /** Interconnect queue wait in months (if disclosed). */
    interconnectQueueMonths: number;
    /** Historical p99 grid outage minutes per year. */
    grid99PercentileOutageMin: number;
    /** Peak ground acceleration (g) at 10% in 50 yr exceedance (USGS/GEM). */
    seismicPGA: number;
    /** Flood return period in years for the nominal parcel. */
    floodReturnPeriod: number;
    /** Permitting timeline months, P50. */
    permittingMonthsP50: number;
    /** Permitting timeline months, P90. */
    permittingMonthsP90: number;
    /** Water stress index 0..1 (WRI Aqueduct). */
    waterStressIndex: number;
    /** Real-world climate cooling load relative index (100 = baseline tropical). */
    climateCoolingLoadKW: number;
    /** Political risk composite 0..100 (0 = safest). Sources: EIU + WGI + V-Dem. */
    politicalRiskScore: number;
    /** RTT in ms to nearest Tier-1 IX (Telegeography + PCH). */
    latencyToBigIXms: number;
    /** Incentives composite 0..100 (per-jurisdiction investment schedule). */
    incentivesScore: number;
    /** Talent composite 0..100 (local STEM workforce + unemployment + visa). */
    talentScore: number;
    /** Hyperscaler region-adjacency composite 0..100. */
    hyperscalerProximityScore: number;
  }>;
  /** Citation ids for the prior signals bundle. */
  cite_ids: string[];
}

// ---------------------------------------------------------------------------
// GPUs & workloads
// ---------------------------------------------------------------------------

export type GPUSku = "H100" | "H200" | "B200" | "GB200-NVL72" | "MI300X";

export interface GPUSpec {
  sku: GPUSku;
  vendor: "NVIDIA" | "AMD";
  tdpW: number;
  systemCount: number;
  systemTdpKW: number;
  rackDensityKW: number;
  interconnect: "NVLink-4" | "NVLink-5" | "InfinityFabric";
  memoryTBs: number;
  memoryBandwidthTBps: number;
  cooling: "air" | "liquid-dlc" | "immersion";
  /** Channel-list system MSRP in USD. 0 if unknown. */
  systemMSRPUSD: number;
  referenceUrls?: string[];
  cite_ids: string[];
}

export class UnknownGpuError extends Error {
  constructor(sku: string) {
    super(`Unknown GPU SKU "${sku}". Add it to src/data/gpu-specs.json or pick a known one.`);
    this.name = "UnknownGpuError";
  }
}

export type WorkloadShape = "training" | "inference" | "mixed";

export interface WorkloadProfile {
  shape: WorkloadShape;
  gpu: GPUSku;
  clusterMW: number;
  latencySLAms?: number;
  customerGeography?: string;
  dataGeography?: string;
  sustainabilityTarget?: { pueMax?: number; renewableMin?: number };
  budgetUSDPerMWhMax?: number;
}

// ---------------------------------------------------------------------------
// Agent + debate primitives
// ---------------------------------------------------------------------------

export type AgentModel = "opus" | "sonnet";

export interface AgentRole {
  id: string;
  displayName: string;
  model: AgentModel;
  systemPromptKey: string;
}

export interface AgentTurn {
  agent: string;
  phase: "opening" | "rebuttal" | "synthesis" | "extraction" | "tool";
  content: string;
  timestamp: string;
}

export interface DebateResult<TDecision = unknown> {
  decision: TDecision;
  confidence: number;
  dissents: string[];
  turns: AgentTurn[];
  modelUsage: { opus: number; sonnet: number };
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Preset
// ---------------------------------------------------------------------------

export interface DemoPreset<TInput = unknown> {
  id: string;
  module: "m1" | "m2" | "m3" | "m4";
  title: string;
  description: string;
  input: TInput;
  expectedHighlights: string[];
}
