import type { DAMACFacility } from "@/lib/shared/types";
import type { M2Workload } from "../types";
import { computeRackLayout } from "./rackDensity";

/**
 * Rack-level OpEx — country/metro-specific retail colo rates from
 * CBRE Global Data Center Trends H2 2025. Falls back to a conservative
 * blended $1,900/rack/mo if a facility doesn't have its own pricing.
 */
export interface RackOpexBreakdown {
  rackCount: number;
  usdPerRackPerMonth: number;
  monthlyTotalUSD: number;
  cite_ids: string[];
}

const DEFAULT_RACK_USD = 1900;

export function computeRackOpex(facility: DAMACFacility, workload: M2Workload): RackOpexBreakdown {
  const { rackCount } = computeRackLayout(workload.gpu, workload.clusterMW);
  const usdPerRack = facility.rackUSDPerMonth ?? DEFAULT_RACK_USD;
  const monthlyTotal = rackCount * usdPerRack;
  return {
    rackCount,
    usdPerRackPerMonth: usdPerRack,
    monthlyTotalUSD: Math.round(monthlyTotal),
    cite_ids: ["cbre-dc-trends-h2-2025"],
  };
}
