export type BuildCategory =
  | "predevelopment"
  | "permits"
  | "utility"
  | "procurement"
  | "construction"
  | "commissioning";

export interface M5Input {
  projectId: string;
  projectName: string;
  geography: string;
  targetMW: number;
  plannedNoticeToProceed: string;
  permitComplexity: 1 | 2 | 3 | 4 | 5;
  utilityQueueMonths: number;
  longLeadTightness: 1 | 2 | 3 | 4 | 5;
  epcReadiness: 1 | 2 | 3 | 4 | 5;
  contingencyPct: number;
}

export interface BuildMilestone {
  id: string;
  name: string;
  owner: string;
  category: BuildCategory;
  dependsOn: string[];
  durationDays: number;
  slipProbabilityPct: number;
  p50Finish: string;
  p90Finish: string;
  critical: boolean;
}

export interface BuildRisk {
  id: string;
  title: string;
  category: BuildCategory;
  probabilityPct: number;
  impactDays: number;
  impactUSDm: number;
  exposureUSDm: number;
  severity: "low" | "medium" | "high";
  mitigation: string;
}

export interface M5Output {
  input: M5Input;
  milestones: BuildMilestone[];
  risks: BuildRisk[];
  p50EnergizationDate: string;
  p90EnergizationDate: string;
  scheduleSpreadDays: number;
  capexAtRiskUSDm: number;
  recommendations: string[];
  generatedAt: string;
}
