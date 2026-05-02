import type { DispatchSlot, GridRisk, M7Input, M7Output } from "../types";

const CONTRACT_BASE_COST: Record<M7Input["contractMode"], number> = {
  "firm-ppa": 93,
  "hybrid-ppa-spot": 105,
  merchant: 122,
};

const DISPATCH_WINDOWS = [
  { slotId: "w1", label: "00:00-08:00", demandFactor: 0.9, spotFactor: 0.86 },
  { slotId: "w2", label: "08:00-16:00", demandFactor: 1.06, spotFactor: 1.12 },
  { slotId: "w3", label: "16:00-24:00", demandFactor: 0.98, spotFactor: 1.05 },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, digits = 2): number {
  const p = 10 ** digits;
  return Math.round(value * p) / p;
}

function getReserveFactor(policy: M7Input["reservePolicy"]): number {
  return policy === "N-2" ? 0.16 : 0.1;
}

function buildDispatchPlan(input: M7Input, grossFacilityMW: number): DispatchSlot[] {
  const utilityBase = input.utilityFeedMW;
  const onsiteBase = input.onsiteGenerationMW;
  const batteryPowerCapMW = clamp(input.batteryMWh * 0.25, 4, 40);

  return DISPATCH_WINDOWS.map((window, idx) => {
    const demandMW = grossFacilityMW * window.demandFactor;
    const utilityMW = round(clamp(utilityBase * (0.95 - idx * 0.04), utilityBase * 0.72, utilityBase), 2);
    const onsiteMW = round(clamp(onsiteBase * (0.9 + idx * 0.06), onsiteBase * 0.75, onsiteBase), 2);

    const deficit = Math.max(0, demandMW - utilityMW - onsiteMW);
    const batteryDischargeMW = round(clamp(deficit * 0.7, 0, batteryPowerCapMW), 2);

    const expectedMarginMW = round(utilityMW + onsiteMW + batteryDischargeMW - demandMW, 2);
    const slotSpotPrice = input.spotPriceUSDPerMWh * window.spotFactor;
    const contractCost = CONTRACT_BASE_COST[input.contractMode];
    const batteryAdder = batteryDischargeMW > 0 ? 7 : 0;

    const marginalCostUSDPerMWh = round(
      clamp(contractCost * 0.76 + slotSpotPrice * 0.24 + batteryAdder, 70, 320),
      2,
    );

    return {
      slotId: window.slotId,
      label: window.label,
      utilityMW,
      onsiteMW,
      batteryDischargeMW,
      expectedMarginMW,
      marginalCostUSDPerMWh,
    };
  });
}

function buildRisks(input: M7Input, grossFacilityMW: number, reserveHeadroomMW: number): GridRisk[] {
  const shortfallProb = clamp(
    16 + Math.max(0, grossFacilityMW - input.utilityFeedMW - input.onsiteGenerationMW) * 1.2,
    8,
    88,
  );

  const volatilityProb = clamp(
    20 + (input.contractMode === "merchant" ? 20 : input.contractMode === "hybrid-ppa-spot" ? 12 : 6),
    8,
    92,
  );

  const reserveProb = clamp(18 + Math.max(0, 8 - reserveHeadroomMW) * 2.2, 8, 95);

  const batteryProb = clamp(14 + Math.max(0, grossFacilityMW - input.batteryMWh * 0.6) * 0.6, 8, 86);

  const risks: Array<Omit<GridRisk, "exposureScore" | "severity">> = [
    {
      id: "r-grid-shortfall",
      title: "Grid import shortfall during peak dispatch window",
      probabilityPct: round(shortfallProb, 1),
      impactMW: round(clamp(grossFacilityMW * 0.18, 4, 24), 1),
      mitigation:
        "Pre-schedule demand response for non-critical training queues and lock standby generation dispatch bands.",
    },
    {
      id: "r-price-volatility",
      title: "Spot power price spike exposure",
      probabilityPct: round(volatilityProb, 1),
      impactMW: round(clamp(grossFacilityMW * 0.11, 3, 16), 1),
      mitigation:
        "Increase fixed-price hedge ratio for peak windows and set dynamic curtailment trigger in market orchestration.",
    },
    {
      id: "r-reserve-erosion",
      title: "N-reserve erosion under coincident outage",
      probabilityPct: round(reserveProb, 1),
      impactMW: round(clamp(grossFacilityMW * 0.14, 3.5, 20), 1),
      mitigation:
        "Raise reserve floor and run weekly black-start drills to validate failover sequence and response timing.",
    },
    {
      id: "r-battery-duration",
      title: "Battery duration depletion before recovery",
      probabilityPct: round(batteryProb, 1),
      impactMW: round(clamp(grossFacilityMW * 0.09, 2.5, 14), 1),
      mitigation:
        "Shift battery SOC policy to preserve emergency depth and reserve mid-day charge corridor for contingency.",
    },
  ];

  return risks
    .map((risk) => {
      const exposureScore = round((risk.probabilityPct / 100) * risk.impactMW, 2);
      const severity: GridRisk["severity"] =
        exposureScore >= 3.2 ? "high" : exposureScore >= 1.8 ? "medium" : "low";
      return { ...risk, exposureScore, severity };
    })
    .sort((a, b) => b.exposureScore - a.exposureScore);
}

export function runM7(input: M7Input): M7Output {
  const grossFacilityMW = round(input.targetITMW * input.pue, 2);
  const reserveFactor = getReserveFactor(input.reservePolicy);

  const firmAvailableMW = round(input.utilityFeedMW + input.onsiteGenerationMW, 2);
  const reserveHeadroomMW = round(firmAvailableMW * reserveFactor, 2);

  const dispatchPlan = buildDispatchPlan(input, grossFacilityMW);

  const maxDeficitMW = Math.max(0, ...dispatchPlan.map((slot) => -slot.expectedMarginMW));
  const curtailedLoadMW = round(
    clamp(maxDeficitMW - input.batteryMWh * 0.25, 0, grossFacilityMW * (input.demandResponsePct / 100)),
    2,
  );

  const batteryRuntimeMinAtDeficit = round(
    maxDeficitMW > 0 ? (input.batteryMWh / Math.max(maxDeficitMW, 0.1)) * 60 : 240,
    1,
  );

  const weightedSlotCost =
    dispatchPlan.reduce((sum, slot, idx) => sum + slot.marginalCostUSDPerMWh * [0.34, 0.36, 0.3][idx], 0) /
    1;

  const blendedPowerCostUSDPerMWh = round(
    clamp(weightedSlotCost + (curtailedLoadMW > 0 ? 6 : 0), 75, 330),
    2,
  );

  const annualEnergyMWh = grossFacilityMW * 24 * 365;
  const annualPowerCostUSDm = round((annualEnergyMWh * blendedPowerCostUSDPerMWh) / 1_000_000, 2);

  const gridRisks = buildRisks(input, grossFacilityMW, reserveHeadroomMW);

  const recommendations = [
    `Keep spinning reserve at or above ${reserveHeadroomMW.toFixed(2)} MW and enforce ${input.reservePolicy} contingency drills before weekly demand peaks.`,
    `Rebalance dispatch to cap peak-window spot exposure and target blended power cost below $${(blendedPowerCostUSDPerMWh * 0.95).toFixed(2)}/MWh.`,
    `Pre-approve up to ${Math.max(curtailedLoadMW, 2).toFixed(2)} MW non-critical load curtailment to protect inference SLAs during grid stress events.`,
  ];

  return {
    input,
    grossFacilityMW,
    firmAvailableMW,
    reserveHeadroomMW,
    curtailedLoadMW,
    batteryRuntimeMinAtDeficit,
    blendedPowerCostUSDPerMWh,
    annualPowerCostUSDm,
    dispatchPlan,
    gridRisks,
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}
