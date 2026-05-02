export type TenantArchetype =
  | "frontier-training"
  | "sovereign-inference"
  | "enterprise-finetune"
  | "managed-cloud-burst";

export type M8PricingMode = "capacity-reservation" | "usage-indexed" | "hybrid";

export interface M8Input {
  facilityId: string;
  facilityName: string;
  geography: string;
  availableMW: number;
  committedMW: number;
  targetGpu: "H100" | "H200" | "B200" | "GB200-NVL72" | "MI300X";
  pue: number;
  pricingMode: M8PricingMode;
  contractTermYears: number;
  renewablePremiumPct: number;
  financingCostPct: number;
  targetGrossMarginPct: number;
}

export interface TenantFit {
  tenantId: string;
  archetype: TenantArchetype;
  requiredMW: number;
  fitScore: number;
  expectedUtilizationPct: number;
  expectedPriceUSDPerMWh: number;
  annualRevenueUSDm: number;
  grossMarginPct: number;
  risk: "low" | "medium" | "high";
}

export interface RevenueScenario {
  scenarioId: "downside" | "base" | "upside";
  label: string;
  annualRevenueUSDm: number;
  grossMarginPct: number;
  occupancyPct: number;
}

export interface M8Output {
  input: M8Input;
  sellableMW: number;
  unallocatedMW: number;
  weightedPriceUSDPerMWh: number;
  totalProjectedRevenueUSDm: number;
  weightedGrossMarginPct: number;
  paybackMonthsP50: number;
  paybackMonthsP90: number;
  tenantFits: TenantFit[];
  revenueScenarios: RevenueScenario[];
  recommendations: string[];
  generatedAt: string;
}
