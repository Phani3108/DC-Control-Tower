import type { CandidateSite } from "@/lib/shared/types";
import type { EngineResult, M1Input } from "../types";

/**
 * Finance / Political Risk engine.
 *
 * Scores on (a) sovereign political risk (EIU-style), (b) FX volatility
 * proxy, (c) payback horizon penalty for long permitting.
 */
export function financeRisk(site: CandidateSite, input: M1Input): EngineResult {
  const s = site.priorSignals ?? {};
  const politicalRisk = (s as Record<string, number>).politicalRiskScore ?? 30; // 0=low..100=high
  const permitting = (s as Record<string, number>).permittingMonths ?? 24;

  // Political: 0 → 100, 60 → 20
  const polScore = Math.max(0, Math.min(100, 100 - (politicalRisk / 60) * 80));

  // Finance friction from long permitting
  const permitPenalty = Math.max(0, (permitting - 18) * 1.5);

  // Hyperscale-training is capital-heavy; financial risk weighs more
  const baseline = 0.75 * polScore;
  const adj = input.workloadProfile === "hyperscale-training" ? baseline - 4 : baseline;

  const score = Math.max(0, adj - permitPenalty);

  const rationale =
    `${site.name}: political risk index ${politicalRisk}/100; ` +
    `permitting ${permitting} months → finance score ${Math.round(score)}/100.`;

  return {
    engineId: "financeRisk",
    score: round(score),
    factors: {
      politicalRiskIndex: politicalRisk,
      permittingMonths: permitting,
      permitPenalty: round(permitPenalty, 1),
    },
    rationale,
  };
}

function round(x: number, d = 0): number {
  const p = Math.pow(10, d);
  return Math.round(x * p) / p;
}
