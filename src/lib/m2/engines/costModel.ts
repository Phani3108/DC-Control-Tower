import type { DAMACFacility } from "@/lib/shared/types";
import type { CostBreakdown, CostLayer, M2Workload } from "../types";
import { computeGPUCapex } from "./gpuCapex";
import { computeRackOpex } from "./rackOpex";
import { computeStaffOpex } from "./staffOpex";
import { computeUtilitiesOpex } from "./utilitiesOpex";

/**
 * 6-layer cost model.
 *
 * Decomposition:
 *   1. Power          (IEA WEO 2024)
 *   2. Cooling        (PUE overhead from facility puERampYear1)
 *   3. GPU amortization (SemiAnalysis B200 2025 + NVIDIA refs, 4-yr / 15% residual)
 *   4. Real estate    (CBRE per-metro rack pricing)
 *   5. Network        (cross-connects + transit, per-rack heuristic)
 *   6. Staff / ops    (Uptime salary survey + AOS 2024)
 */
export function buildCostBreakdown(facility: DAMACFacility, workload: M2Workload): CostBreakdown {
  const utilities = computeUtilitiesOpex(facility, workload);
  const gpuCapex = computeGPUCapex(workload);
  const rack = computeRackOpex(facility, workload);
  const staff = computeStaffOpex(workload, gpuCapex.totalCapexUSD);

  // Network — per rack transit + cross-connect heuristic; keep modest.
  const networkUSDPerMonth = rack.rackCount * 600;

  const layers: CostLayer[] = [
    {
      layer: "power",
      usdPerMonth: utilities.powerUSDPerMonth,
      breakdown: {
        mwhPerMonth: utilities.mwhPerMonth,
        usdPerMWh: utilities.powerUSDPerMWh,
      },
    },
    {
      layer: "cooling",
      usdPerMonth: utilities.coolingPremiumUSDPerMonth,
      breakdown: {
        puE: utilities.pueUsed,
        puePremiumPct: Math.round((utilities.pueUsed - 1) * 100),
      },
    },
    {
      layer: "gpu-amortization",
      usdPerMonth: gpuCapex.monthlyAmortUSD,
      breakdown: {
        totalSystems: gpuCapex.totalSystems,
        systemMSRPUSD: gpuCapex.systemMSRPUSD,
        amortYears: gpuCapex.amortYears,
        residualPct: Math.round(gpuCapex.residualPct * 100),
      },
    },
    {
      layer: "real-estate",
      usdPerMonth: rack.monthlyTotalUSD,
      breakdown: {
        rackCount: rack.rackCount,
        usdPerRackPerMonth: rack.usdPerRackPerMonth,
      },
    },
    {
      layer: "network",
      usdPerMonth: networkUSDPerMonth,
      breakdown: {
        rackCount: rack.rackCount,
        usdPerRackPerMonth: 600,
      },
    },
    {
      layer: "staff-ops",
      usdPerMonth: staff.totalUSDPerMonth,
      breakdown: {
        staffUSDPerMonth: staff.staffUSDPerMonth,
        maintenanceUSDPerMonth: staff.maintenanceUSDPerMonth,
        insuranceUSDPerMonth: staff.insuranceUSDPerMonth,
        ftePerMW: staff.ftePerMW,
      },
    },
  ];

  const totalUSDPerMonth = layers.reduce((s, l) => s + l.usdPerMonth, 0);
  const totalUSDPerMWh = totalUSDPerMonth / utilities.mwhPerMonth;
  const threeYearUSDm = (totalUSDPerMonth * 36) / 1_000_000;

  return {
    totalUSDPerMonth: Math.round(totalUSDPerMonth),
    totalUSDPerMWh: Math.round(totalUSDPerMWh * 10) / 10,
    layers,
    threeYearUSDm: Math.round(threeYearUSDm * 10) / 10,
  };
}
