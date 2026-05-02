export type CoolingMode = "air" | "hybrid-dlc" | "full-dlc";
export type RedundancyTier = "N+1" | "2N";

export interface M6Input {
  facilityId: string;
  facilityName: string;
  geography: string;
  targetITMW: number;
  ambientTempC: number;
  humidityPct: number;
  coolingMode: CoolingMode;
  redundancyTier: RedundancyTier;
  rackDensityKW: number;
  pueTarget: number;
}

export interface CoolingSetpoint {
  zoneId: string;
  zoneName: string;
  supplyTempC: number;
  fanSpeedPct: number;
  chillerLoadPct: number;
  expectedPUE: number;
}

export interface ThermalRisk {
  id: string;
  title: string;
  probabilityPct: number;
  impactTempC: number;
  exposureScore: number;
  severity: "low" | "medium" | "high";
  mitigation: string;
}

export interface M6Output {
  input: M6Input;
  currentPUE: number;
  optimizedPUEP50: number;
  optimizedPUEP90: number;
  coolingEnergySavingsPct: number;
  annualSavingsUSDm: number;
  setpointPlan: CoolingSetpoint[];
  hotspotRisks: ThermalRisk[];
  recommendations: string[];
  generatedAt: string;
}
