import type { CoolingSetpoint, M6Input, M6Output, ThermalRisk } from "../types";

const MODE_BASE_PUE: Record<M6Input["coolingMode"], number> = {
  air: 1.42,
  "hybrid-dlc": 1.31,
  "full-dlc": 1.22,
};

const MODE_OPTIMIZATION_POTENTIAL: Record<M6Input["coolingMode"], number> = {
  air: 0.075,
  "hybrid-dlc": 0.095,
  "full-dlc": 0.07,
};

const ZONES = [
  { id: "z1", name: "Ingress and hot-aisle north" },
  { id: "z2", name: "Pod C east lanes" },
  { id: "z3", name: "Pod C west lanes" },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, digits = 2): number {
  const p = 10 ** digits;
  return Math.round(value * p) / p;
}

function buildSetpointPlan(input: M6Input, currentPUE: number, optimizedPUEP50: number): CoolingSetpoint[] {
  const baseSupply = input.coolingMode === "air" ? 20.5 : input.coolingMode === "hybrid-dlc" ? 23.2 : 25;

  return ZONES.map((zone, idx) => {
    const supplyTempC = round(baseSupply + idx * 0.45 + Math.max(0, input.ambientTempC - 35) * 0.1, 1);
    const fanSpeedPct = round(
      clamp(
        50 + input.rackDensityKW * 0.28 + idx * 6 - (input.coolingMode === "full-dlc" ? 7 : 0),
        42,
        96,
      ),
      1,
    );
    const chillerLoadPct = round(
      clamp(46 + input.targetITMW * 0.42 + idx * 5 + Math.max(0, input.ambientTempC - 30) * 0.9, 38, 98),
      1,
    );

    const delta = (currentPUE - optimizedPUEP50) * (0.36 - idx * 0.08);
    const expectedPUE = round(clamp(currentPUE - delta, optimizedPUEP50, currentPUE), 3);

    return {
      zoneId: zone.id,
      zoneName: zone.name,
      supplyTempC,
      fanSpeedPct,
      chillerLoadPct,
      expectedPUE,
    };
  });
}

function buildRisks(input: M6Input): ThermalRisk[] {
  const recirculationProb = clamp(22 + (input.rackDensityKW - 70) * 0.65 + (input.ambientTempC - 34) * 1.2, 8, 92);
  const condenserProb = clamp(18 + (input.ambientTempC - 32) * 1.4 + (input.humidityPct - 50) * 0.4, 8, 90);
  const pumpProb = clamp(14 + input.targetITMW * 0.35 + (input.redundancyTier === "2N" ? -3 : 4), 8, 88);
  const controlsProb = clamp(16 + (input.coolingMode === "air" ? 8 : 4) + (input.rackDensityKW - 80) * 0.3, 8, 80);

  const risks: Array<Omit<ThermalRisk, "exposureScore" | "severity">> = [
    {
      id: "r-recirculation",
      title: "Hot-aisle recirculation risk",
      probabilityPct: round(recirculationProb, 1),
      impactTempC: round(4.2 + (input.rackDensityKW - 80) * 0.03, 1),
      mitigation: "Increase containment integrity checks and tune fan offsets between Pod C east/west aisles.",
    },
    {
      id: "r-condenser",
      title: "Condenser approach drift in peak ambient",
      probabilityPct: round(condenserProb, 1),
      impactTempC: round(3.6 + Math.max(0, input.ambientTempC - 36) * 0.15, 1),
      mitigation: "Apply pre-cooling schedule and lock condenser cleaning cadence before peak-temperature window.",
    },
    {
      id: "r-pump",
      title: "Primary loop pump cavitation",
      probabilityPct: round(pumpProb, 1),
      impactTempC: round(3 + input.targetITMW * 0.015, 1),
      mitigation: "Re-baseline NPSH margins and pre-stage standby pump switchover at elevated demand.",
    },
    {
      id: "r-controls",
      title: "Cooling control-loop oscillation",
      probabilityPct: round(controlsProb, 1),
      impactTempC: round(2.8 + (input.coolingMode === "air" ? 0.9 : 0.4), 1),
      mitigation: "Tighten PID deadband and cap setpoint step size during autonomous control cycles.",
    },
  ];

  return risks
    .map((risk) => {
      const exposureScore = round((risk.probabilityPct / 100) * risk.impactTempC, 2);
      const severity: ThermalRisk["severity"] =
        exposureScore >= 2.2 ? "high" : exposureScore >= 1.3 ? "medium" : "low";
      return { ...risk, exposureScore, severity };
    })
    .sort((a, b) => b.exposureScore - a.exposureScore);
}

export function runM6(input: M6Input): M6Output {
  const basePUE = MODE_BASE_PUE[input.coolingMode];
  const ambientPenalty = Math.max(0, input.ambientTempC - 24) * 0.007;
  const humidityPenalty = Math.max(0, input.humidityPct - 45) * 0.0012;
  const densityPenalty = Math.max(0, input.rackDensityKW - 60) * 0.0011;
  const redundancyPenalty = input.redundancyTier === "2N" ? 0.026 : 0.014;

  const currentPUE = round(basePUE + ambientPenalty + humidityPenalty + densityPenalty + redundancyPenalty, 3);

  const optimizationDelta =
    MODE_OPTIMIZATION_POTENTIAL[input.coolingMode] + ambientPenalty * 0.22 + densityPenalty * 0.18;

  const optimizedPUEP50 = round(clamp(currentPUE - optimizationDelta, 1.12, currentPUE - 0.01), 3);
  const optimizedPUEP90 = round(optimizedPUEP50 + 0.024 + (ambientPenalty + densityPenalty) * 0.45, 3);

  const coolingEnergySavingsPct = round(
    clamp(((currentPUE - optimizedPUEP50) / Math.max(currentPUE - 1, 0.15)) * 100, 4, 35),
    1,
  );

  const annualITEnergyMWh = input.targetITMW * 24 * 365;
  const savedCoolingMWh = annualITEnergyMWh * (currentPUE - optimizedPUEP50);
  const annualSavingsUSDm = round((savedCoolingMWh * 95) / 1_000_000, 2);

  const setpointPlan = buildSetpointPlan(input, currentPUE, optimizedPUEP50);
  const hotspotRisks = buildRisks(input);

  const recommendations = [
    `Run autonomous cooling loops against a guardband of ${(optimizedPUEP90 - optimizedPUEP50).toFixed(3)} PUE to protect reliability under peak ambient shifts.`,
    `Prioritize ${hotspotRisks[0]?.title.toLowerCase() ?? "thermal stability"} with zone-level daily reviews until exposure drops below ${round((hotspotRisks[0]?.exposureScore ?? 0) * 0.7, 2)}.`,
    `Lock a weekly FinOps checkpoint to capture approximately $${annualSavingsUSDm.toFixed(2)}M annualized cooling savings at the current load profile.`,
  ];

  return {
    input,
    currentPUE,
    optimizedPUEP50,
    optimizedPUEP90,
    coolingEnergySavingsPct,
    annualSavingsUSDm,
    setpointPlan,
    hotspotRisks,
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}
