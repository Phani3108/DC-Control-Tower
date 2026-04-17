import type { DAMACFacility } from "@/lib/shared/types";
import type { CostBreakdown, CostLayer, M2Workload } from "../types";
import { computeRackLayout } from "./rackDensity";

/**
 * 6-layer colocation cost model.
 *
 * Layers: power, cooling, GPU amortization (for customer reference),
 * real estate, network, staff/ops. Demo-grade — defensible relative
 * magnitudes, not a CFO-grade model.
 */

const COUNTRY_PRICE_USDMWh: Record<string, number> = {
  US: 85, AE: 95, SA: 72, ID: 90, TH: 115, MY: 80, ES: 125, GR: 135, TR: 145,
};

export function buildCostBreakdown(
  facility: DAMACFacility,
  workload: M2Workload,
): CostBreakdown {
  const hoursPerMonth = 730;
  const mwhPerMonth = workload.clusterMW * hoursPerMonth;

  const powerUSDMWh = COUNTRY_PRICE_USDMWh[facility.countryCode] ?? 130;
  const powerUSDMonth = mwhPerMonth * powerUSDMWh;

  // Cooling cost modeled as a PUE premium on power
  const pueOverhead = (facility.puE - 1) * powerUSDMonth;

  // GPU amortization (customer side — 3-yr straight-line on DGX-class gear)
  const { rackCount, systemsPerRack } = computeRackLayout(workload.gpu, workload.clusterMW);
  const dgxUSDPerSystem = workload.gpu.includes("B200") ? 420_000 : workload.gpu.includes("H200") ? 300_000 : 275_000;
  const totalSystems = rackCount * systemsPerRack;
  const gpuAmortPerMonth = (totalSystems * dgxUSDPerSystem) / 36;

  // Real estate: per-rack monthly colo fee
  const realEstatePerRackPerMonth = 2_500;
  const realEstateUSDMonth = rackCount * realEstatePerRackPerMonth;

  // Network — cross-connects + transit
  const networkUSDMonth = rackCount * 600;

  // Staff / operations
  const staffUSDMonth = workload.clusterMW * 10_000; // ~$10k/MW/mo blended

  const layers: CostLayer[] = [
    {
      layer: "power",
      usdPerMonth: Math.round(powerUSDMonth),
      breakdown: { mwhPerMonth: Math.round(mwhPerMonth), usdPerMWh: powerUSDMWh },
    },
    {
      layer: "cooling",
      usdPerMonth: Math.round(pueOverhead),
      breakdown: { puE: facility.puE, puePremiumPct: Math.round((facility.puE - 1) * 100) },
    },
    {
      layer: "gpu-amortization",
      usdPerMonth: Math.round(gpuAmortPerMonth),
      breakdown: {
        totalSystems,
        usdPerSystem: dgxUSDPerSystem,
        amortYears: 3,
      },
    },
    {
      layer: "real-estate",
      usdPerMonth: Math.round(realEstateUSDMonth),
      breakdown: { rackCount, usdPerRackPerMonth: realEstatePerRackPerMonth },
    },
    {
      layer: "network",
      usdPerMonth: Math.round(networkUSDMonth),
      breakdown: { rackCount, usdPerRackPerMonth: 600 },
    },
    {
      layer: "staff-ops",
      usdPerMonth: Math.round(staffUSDMonth),
      breakdown: { mw: workload.clusterMW, usdPerMWPerMonth: 10_000 },
    },
  ];

  const totalUSDPerMonth = layers.reduce((s, l) => s + l.usdPerMonth, 0);
  const totalUSDPerMWh = totalUSDPerMonth / mwhPerMonth;
  const threeYearUSDm = (totalUSDPerMonth * 36) / 1_000_000;

  return {
    totalUSDPerMonth: Math.round(totalUSDPerMonth),
    totalUSDPerMWh: Math.round(totalUSDPerMWh * 10) / 10,
    layers,
    threeYearUSDm: Math.round(threeYearUSDm * 10) / 10,
  };
}
