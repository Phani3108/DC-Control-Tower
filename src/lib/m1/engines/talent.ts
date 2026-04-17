import type { CandidateSite } from "@/lib/shared/types";
import type { EngineResult, M1Input } from "../types";

/** Talent index composite (STEM workforce + unemployment + visa policy proxy). */
export function talent(site: CandidateSite, _input: M1Input): EngineResult {
  const t = ((site.priorSignals ?? {}) as Record<string, number>).talentScore ?? 55;
  return {
    engineId: "talent",
    score: t,
    factors: { talentIndex: t },
    rationale: `${site.name}: talent availability index ${t}/100 (STEM + M&E workforce + visa).`,
    cite_ids: ["internal-estimate-2026"],
  };
}
