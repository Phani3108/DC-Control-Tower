import type { CandidateSite } from "@/lib/shared/types";
import type { EngineResult, M1Input } from "../types";

/**
 * Cooling engine — climate load × water stress × DLC-readiness.
 *
 * Scores assume DAMAC builds DLC-ready from v1 onward. Tropical sites
 * still incur higher PUE even with DLC due to wet-bulb limits.
 */
export function cooling(site: CandidateSite, input: M1Input): EngineResult {
  const s = (site.priorSignals ?? {}) as Record<string, number>;
  const load = s.climateCoolingLoadKW ?? 90;
  const waterStress = s.waterStressIndex ?? 0.5;

  // 70 index = 100; 100 index = 40
  const loadScore = Math.max(0, 100 - (load - 70) * 2);

  // Water stress — 0.2 → 100, 0.8 → 20
  const waterScore = Math.max(0, Math.min(100, 100 - (waterStress - 0.2) * 133));

  const dlcSuitability = input.workloadProfile === "hyperscale-training" ? 92 : 75;

  const score = 0.45 * loadScore + 0.35 * waterScore + 0.20 * dlcSuitability;
  const recommendedMode = load > 88 ? "liquid-dlc" : load > 80 ? "hybrid" : "air";

  return {
    engineId: "cooling",
    score: Math.round(score * 10) / 10,
    factors: {
      coolingLoadIndex: load,
      waterStressIndex: Math.round(waterStress * 100) / 100,
      dlcSuitability,
      recommendedMode,
    },
    rationale: `${site.name}: climate load index ${load}; water stress ${waterStress.toFixed(2)}; DLC suitability ${dlcSuitability}.`,
    cite_ids: ["uptime-global-survey-2024", "nvidia-dgx-superpod-rev-arch-v2"],
  };
}
