export type PowerContractMode = "firm-ppa" | "hybrid-ppa-spot" | "merchant";
export type ReservePolicy = "N-1" | "N-2";

export interface M7Input {
  facilityId: string;
  facilityName: string;
  geography: string;
  targetITMW: number;
  pue: number;
  utilityFeedMW: number;
  onsiteGenerationMW: number;
  batteryMWh: number;
  spotPriceUSDPerMWh: number;
  demandResponsePct: number;
  contractMode: PowerContractMode;
  reservePolicy: ReservePolicy;
}

export interface DispatchSlot {
  slotId: string;
  label: string;
  utilityMW: number;
  onsiteMW: number;
  batteryDischargeMW: number;
  expectedMarginMW: number;
  marginalCostUSDPerMWh: number;
}

export interface GridRisk {
  id: string;
  title: string;
  probabilityPct: number;
  impactMW: number;
  exposureScore: number;
  severity: "low" | "medium" | "high";
  mitigation: string;
}

export interface M7Output {
  input: M7Input;
  grossFacilityMW: number;
  firmAvailableMW: number;
  reserveHeadroomMW: number;
  curtailedLoadMW: number;
  batteryRuntimeMinAtDeficit: number;
  blendedPowerCostUSDPerMWh: number;
  annualPowerCostUSDm: number;
  dispatchPlan: DispatchSlot[];
  gridRisks: GridRisk[];
  recommendations: string[];
  generatedAt: string;
}
