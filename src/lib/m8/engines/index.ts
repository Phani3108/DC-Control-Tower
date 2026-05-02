import type { M8Input, M8Output, RevenueScenario, TenantArchetype, TenantFit } from "../types";

const BASE_PRICE_BY_ARCHETYPE: Record<TenantArchetype, number> = {
  "frontier-training": 158,
  "sovereign-inference": 173,
  "enterprise-finetune": 166,
  "managed-cloud-burst": 149,
};

const BASE_UTIL_BY_ARCHETYPE: Record<TenantArchetype, number> = {
  "frontier-training": 84,
  "sovereign-inference": 76,
  "enterprise-finetune": 72,
  "managed-cloud-burst": 68,
};

const ALLOCATION_BY_ARCHETYPE: Record<TenantArchetype, number> = {
  "frontier-training": 0.31,
  "sovereign-inference": 0.27,
  "enterprise-finetune": 0.22,
  "managed-cloud-burst": 0.2,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, digits = 2): number {
  const p = 10 ** digits;
  return Math.round(value * p) / p;
}

function gpuFitFactor(gpu: M8Input["targetGpu"]): number {
  switch (gpu) {
    case "GB200-NVL72":
      return 1.06;
    case "B200":
      return 1.03;
    case "H200":
      return 1.01;
    case "H100":
      return 0.98;
    case "MI300X":
      return 0.97;
    default:
      return 1;
  }
}

function pricingModeFactor(mode: M8Input["pricingMode"]): number {
  if (mode === "capacity-reservation") return 1.04;
  if (mode === "hybrid") return 1.02;
  return 0.98;
}

function buildTenantFits(input: M8Input, sellableMW: number): TenantFit[] {
  const archetypes: TenantArchetype[] = [
    "frontier-training",
    "sovereign-inference",
    "enterprise-finetune",
    "managed-cloud-burst",
  ];

  const gpuFactor = gpuFitFactor(input.targetGpu);
  const pricingFactor = pricingModeFactor(input.pricingMode);

  return archetypes.map((archetype, idx) => {
    const requiredMW = round(sellableMW * ALLOCATION_BY_ARCHETYPE[archetype], 2);

    const fitScore = round(
      clamp(
        62 +
          gpuFactor * 12 +
          (input.contractTermYears - 3) * 2.4 +
          (input.targetGrossMarginPct - 32) * 0.7 +
          (idx === 1 ? 3 : 0),
        45,
        97,
      ),
      1,
    );

    const expectedUtilizationPct = round(
      clamp(
        BASE_UTIL_BY_ARCHETYPE[archetype] +
          (input.pricingMode === "usage-indexed" ? -3 : 2) +
          (input.contractTermYears - 3) * 1.4 -
          input.renewablePremiumPct * 0.3,
        48,
        96,
      ),
      1,
    );

    const expectedPriceUSDPerMWh = round(
      clamp(
        BASE_PRICE_BY_ARCHETYPE[archetype] * pricingFactor +
          input.renewablePremiumPct * 0.65 +
          input.financingCostPct * 0.5,
        95,
        310,
      ),
      2,
    );

    const annualRevenueUSDm = round(
      (requiredMW * (expectedUtilizationPct / 100) * 24 * 365 * expectedPriceUSDPerMWh) / 1_000_000,
      2,
    );

    const grossMarginPct = round(
      clamp(
        input.targetGrossMarginPct +
          (fitScore - 70) * 0.09 -
          input.financingCostPct * 0.45 -
          (input.pricingMode === "usage-indexed" ? 1.3 : 0),
        18,
        64,
      ),
      1,
    );

    const risk: TenantFit["risk"] =
      fitScore >= 84 && grossMarginPct >= input.targetGrossMarginPct - 2
        ? "low"
        : fitScore >= 72
          ? "medium"
          : "high";

    return {
      tenantId: `tenant-${idx + 1}`,
      archetype,
      requiredMW,
      fitScore,
      expectedUtilizationPct,
      expectedPriceUSDPerMWh,
      annualRevenueUSDm,
      grossMarginPct,
      risk,
    };
  }).sort((a, b) => b.annualRevenueUSDm - a.annualRevenueUSDm);
}

function buildRevenueScenarios(totalRevenue: number, weightedMargin: number, occupancyPct: number): RevenueScenario[] {
  return [
    {
      scenarioId: "downside",
      label: "Downside",
      annualRevenueUSDm: round(totalRevenue * 0.84, 2),
      grossMarginPct: round(weightedMargin - 4.2, 1),
      occupancyPct: round(occupancyPct * 0.88, 1),
    },
    {
      scenarioId: "base",
      label: "Base",
      annualRevenueUSDm: round(totalRevenue, 2),
      grossMarginPct: round(weightedMargin, 1),
      occupancyPct: round(occupancyPct, 1),
    },
    {
      scenarioId: "upside",
      label: "Upside",
      annualRevenueUSDm: round(totalRevenue * 1.14, 2),
      grossMarginPct: round(weightedMargin + 3.1, 1),
      occupancyPct: round(Math.min(99, occupancyPct * 1.08), 1),
    },
  ];
}

export function runM8(input: M8Input): M8Output {
  const sellableMW = round(clamp(input.availableMW - input.committedMW, 0, input.availableMW), 2);
  const tenantFits = buildTenantFits(input, sellableMW);

  const allocatedMW = round(tenantFits.reduce((sum, t) => sum + t.requiredMW, 0), 2);
  const unallocatedMW = round(clamp(sellableMW - allocatedMW, 0, sellableMW), 2);

  const totalProjectedRevenueUSDm = round(tenantFits.reduce((sum, t) => sum + t.annualRevenueUSDm, 0), 2);

  const weightedPriceUSDPerMWh = round(
    tenantFits.reduce((sum, t) => sum + t.expectedPriceUSDPerMWh * (t.requiredMW / Math.max(sellableMW, 0.1)), 0),
    2,
  );

  const weightedGrossMarginPct = round(
    tenantFits.reduce((sum, t) => sum + t.grossMarginPct * (t.requiredMW / Math.max(sellableMW, 0.1)), 0),
    1,
  );

  const weightedOccupancy =
    tenantFits.reduce((sum, t) => sum + t.expectedUtilizationPct * (t.requiredMW / Math.max(sellableMW, 0.1)), 0);

  const annualGrossProfitUSDm = totalProjectedRevenueUSDm * (weightedGrossMarginPct / 100);
  const capexReferenceUSDm = sellableMW * 8.4;
  const paybackMonthsP50 = round((capexReferenceUSDm / Math.max(annualGrossProfitUSDm, 0.1)) * 12, 1);
  const paybackMonthsP90 = round(paybackMonthsP50 * 1.2 + input.financingCostPct * 0.7, 1);

  const revenueScenarios = buildRevenueScenarios(totalProjectedRevenueUSDm, weightedGrossMarginPct, weightedOccupancy);

  const topTenant = tenantFits[0];
  const recommendations = [
    `Anchor the next commercial cycle on ${topTenant?.archetype ?? "high-fit tenants"} with ${topTenant?.requiredMW.toFixed(2) ?? "0.00"} MW capacity bands and risk-adjusted pricing guardrails.`,
    `Target blended pricing above $${(weightedPriceUSDPerMWh * 1.02).toFixed(2)}/MWh to preserve margin against ${input.financingCostPct.toFixed(1)}% financing pressure.`,
    `Hold downside occupancy at or above ${Math.max(70, revenueScenarios[0]?.occupancyPct ?? 70).toFixed(1)}% with staged onboarding for medium-risk tenants.`,
  ];

  return {
    input,
    sellableMW,
    unallocatedMW,
    weightedPriceUSDPerMWh,
    totalProjectedRevenueUSDm,
    weightedGrossMarginPct,
    paybackMonthsP50,
    paybackMonthsP90,
    tenantFits,
    revenueScenarios,
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}
