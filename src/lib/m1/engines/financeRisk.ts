import type { CandidateSite } from "@/lib/shared/types";
import type { EngineResult, M1Input } from "../types";

/**
 * Finance / Political risk — composite of EIU Democracy Index 2024,
 * World Bank Governance Indicators 2024, and V-Dem 2024. Normalized to
 * a 0..100 score where 0 = most stable.
 */
export function financeRisk(site: CandidateSite, input: M1Input): EngineResult {
  const s = (site.priorSignals ?? {}) as Record<string, number>;
  const politicalRisk = s.politicalRiskScore ?? 40;
  const p50 = s.permittingMonthsP50 ?? 24;

  const polScore = Math.max(0, Math.min(100, 100 - (politicalRisk / 60) * 80));
  const permitPenalty = Math.max(0, (p50 - 18) * 1.2);
  const workloadAdj = input.workloadProfile === "hyperscale-training" ? -4 : 0;

  const score = Math.max(0, 0.75 * polScore + workloadAdj - permitPenalty);

  return {
    engineId: "financeRisk",
    score: Math.round(score * 10) / 10,
    factors: {
      politicalRiskIndex: politicalRisk,
      permittingMonthsP50: p50,
      permitPenalty: Math.round(permitPenalty * 10) / 10,
      workloadAdjustment: workloadAdj,
    },
    rationale: `Political risk ${politicalRisk}/100 (EIU+WGI+V-Dem composite); permitting P50 ${p50} mo.`,
    cite_ids: ["eiu-democracy-index-2024", "world-bank-wgi-2024", "vdem-2024", "dcd-regulatory-tracker"],
  };
}
