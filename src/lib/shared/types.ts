/**
 * Shared types used across all four modules.
 *
 * Anything that crosses a module boundary lives here. Module-private types
 * stay in `lib/m{1..4}/types.ts`.
 */

// ---------------------------------------------------------------------------
// Facilities & sites
// ---------------------------------------------------------------------------

export type FacilityStatus = "operational" | "under-construction" | "planned" | "announced";

export interface DAMACFacility {
  id: string;
  name: string;
  country: string;
  countryCode: string;          // ISO-3166-1 alpha-2
  region: "ME" | "EU" | "APAC" | "US" | "AFRICA";
  city: string;
  coordinates: [number, number]; // [lng, lat] for react-simple-maps
  capacityMW: number;
  operationalMW: number;
  tier: "III" | "IV";
  puE: number;                   // design PUE
  status: FacilityStatus;
  commissioningDate?: string;    // ISO yyyy-mm
  coolingType: "air" | "liquid-dlc" | "immersion" | "hybrid";
  maxRackDensityKW: number;
  sourceUrls: string[];          // press release / filing citations
}

export interface CandidateSite {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  coordinates: [number, number];
  // target capacity envelope being evaluated
  targetMW: number;
  // optional pre-filled signals (otherwise engines fetch at runtime)
  priorSignals?: Partial<{
    avgPowerCostUSDPerMWh: number;
    renewableShare: number;    // 0..1
    grid99PercentileOutageMin: number;
    seismicPGA: number;        // peak ground accel, g
    permittingMonths: number;
  }>;
}

// ---------------------------------------------------------------------------
// GPUs & workloads
// ---------------------------------------------------------------------------

export type GPUSku = "H100" | "H200" | "B200" | "GB200-NVL72" | "MI300X";

export interface GPUSpec {
  sku: GPUSku;
  vendor: "NVIDIA" | "AMD";
  tdpW: number;                 // per-GPU TDP
  systemCount: number;          // GPUs per DGX/HGX system
  systemTdpKW: number;          // full DGX TDP
  rackDensityKW: number;        // typical kW/rack at scale
  interconnect: "NVLink-4" | "NVLink-5" | "InfinityFabric";
  memoryTBs: number;
  memoryBandwidthTBps: number;
  cooling: "air" | "liquid-dlc" | "immersion";
  referenceUrls: string[];
}

export type WorkloadShape = "training" | "inference" | "mixed";

export interface WorkloadProfile {
  shape: WorkloadShape;
  gpu: GPUSku;
  clusterMW: number;
  latencySLAms?: number;
  customerGeography?: string;    // ISO country of end users
  dataGeography?: string;        // ISO country where data originates
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
  systemPromptKey: string;       // key into fastapi/agents/roles/*.yaml
}

export interface AgentTurn {
  agent: string;                 // role id
  phase: "opening" | "rebuttal" | "synthesis" | "extraction" | "tool";
  content: string;               // streamed Markdown
  timestamp: string;
}

export interface DebateResult<TDecision = unknown> {
  decision: TDecision;
  confidence: number;             // 0..1
  dissents: string[];
  turns: AgentTurn[];
  modelUsage: { opus: number; sonnet: number };
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Preset (URL-encoded demo scenarios)
// ---------------------------------------------------------------------------

export interface DemoPreset<TInput = unknown> {
  id: string;                    // e.g. "m1-sea-500mw"
  module: "m1" | "m2" | "m3" | "m4";
  title: string;
  description: string;
  input: TInput;
  expectedHighlights: string[];  // bullet points surfaced on load
}
