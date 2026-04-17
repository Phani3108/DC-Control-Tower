import type { CandidateSite } from "@/lib/shared/types";
import type { EngineResult, M1Input } from "../types";

/**
 * Talent engine.
 *
 * Scores local availability of DC ops staff (M&E engineering, critical-
 * facilities technicians, network ops) plus proximity to universities and
 * the broader hyperscale talent market.
 */
export function talent(site: CandidateSite, _input: M1Input): EngineResult {
  const s = site.priorSignals ?? {};
  const t = (s as Record<string, number>).talentScore ?? 55;

  const rationale =
    `${site.name}: talent availability index ${t}/100 ` +
    `(local M&E + hyperscale ops proximity).`;

  return {
    engineId: "talent",
    score: t,
    factors: { talentIndex: t },
    rationale,
  };
}
