import type { DAMACFacility } from "@/lib/shared/types";
import type { M2Workload } from "../types";
import ieaSnapshot from "@/data/snapshots/iea-weo-2024.json";

interface IEAPrice { spot: number; cagr10yr: number }
const PRICES = (ieaSnapshot as unknown as { prices: Record<string, IEAPrice> }).prices;

/**
 * Utilities OpEx — power + cooling premium (PUE overhead).
 * Power price comes from IEA WEO 2024 APS snapshot per country.
 * Cooling is modeled as the (PUE - 1) × power-draw overhead, using the
 * facility's `puERampYear1` where present (realistic first-year PUE).
 */
export interface UtilitiesOpexBreakdown {
  mwhPerMonth: number;
  powerUSDPerMWh: number;
  powerUSDPerMonth: number;
  pueUsed: number;
  coolingPremiumUSDPerMonth: number;
  totalUSDPerMonth: number;
  cite_ids: string[];
}

export function computeUtilitiesOpex(facility: DAMACFacility, workload: M2Workload): UtilitiesOpexBreakdown {
  const hours = 730;
  const mwh = workload.clusterMW * hours;
  const price = PRICES[facility.countryCode]?.spot ?? 130;
  const pueUsed = facility.puERampYear1 ?? facility.puE;

  const powerUSDPerMonth = mwh * price;
  const coolingPremiumUSDPerMonth = (pueUsed - 1) * powerUSDPerMonth;

  return {
    mwhPerMonth: Math.round(mwh),
    powerUSDPerMWh: price,
    powerUSDPerMonth: Math.round(powerUSDPerMonth),
    pueUsed,
    coolingPremiumUSDPerMonth: Math.round(coolingPremiumUSDPerMonth),
    totalUSDPerMonth: Math.round(powerUSDPerMonth + coolingPremiumUSDPerMonth),
    cite_ids: ["iea-weo-2024", "uptime-global-survey-2024"],
  };
}
