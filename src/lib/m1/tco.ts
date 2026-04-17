import type { CandidateSite } from "@/lib/shared/types";
import type { M1Input } from "./types";

/**
 * Rough 5-year TCO for a target-MW deployment at a candidate site.
 *
 * Demo-grade: lumps CapEx + 5 yrs of OpEx (power + cooling + staff + O&M).
 * Good enough to rank sites relative to each other; not a CFO-grade model.
 */
export function estimate5yrTCO(site: CandidateSite, input: M1Input): number {
  const s = (site.priorSignals ?? {}) as Record<string, number>;
  const mw = input.targetMW;

  // CapEx — $10M/MW for AI-ready colocation, rough industry number
  const capex = 10 * mw;

  // OpEx components (5 yrs)
  const puEAssumed = 1.35;
  const annualMWh = mw * 8760 * puEAssumed;
  const powerUSDPerMWh = s.avgPowerCostUSDPerMWh ?? 120;
  const escalator = 1.035;
  let powerOpex = 0;
  for (let yr = 0; yr < 5; yr++) {
    powerOpex += (annualMWh * powerUSDPerMWh * Math.pow(escalator, yr)) / 1_000_000;
  }

  const staffOpex = 5 * (mw * 0.12);         // $120k/MW/yr rule-of-thumb
  const omOpex = 5 * (mw * 0.35);            // maintenance + networking + misc

  const permittingPremium = (s.permittingMonths ?? 24) > 22 ? 25 : 0;
  const politicalRiskPremium = Math.max(0, (s.politicalRiskScore ?? 30) - 25) * 0.5;

  const totalUSDm = capex + powerOpex + staffOpex + omOpex + permittingPremium + politicalRiskPremium;
  return Math.round(totalUSDm);
}
