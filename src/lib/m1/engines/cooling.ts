import type { CandidateSite } from "@/lib/shared/types";
import type { EngineResult, M1Input } from "../types";

/**
 * Cooling engine.
 *
 * Scores on (a) climate-driven cooling load, (b) water stress, (c) suitability
 * for DLC / immersion given the workload profile (training clusters at 70+ kW/rack
 * benefit most from liquid cooling).
 */
export function cooling(site: CandidateSite, input: M1Input): EngineResult {
  const s = site.priorSignals ?? {};
  const load = (s as Record<string, number>).climateCoolingLoadKW ?? 90;       // relative cooling kW index
  const waterStress = (s as Record<string, number>).waterStressIndex ?? 0.5;   // 0..1

  // Cooling load scoring — 70 index = 100, 100 index = 40
  const loadScore = Math.max(0, 100 - (load - 70) * 2);

  // Water stress — 0.2 → 100, 0.8 → 20
  const waterScore = Math.max(0, Math.min(100, 100 - (waterStress - 0.2) * 133));

  // DLC suitability: always high since DAMAC's next build will be DLC-ready
  const dlcSuitability = input.workloadProfile === "hyperscale-training" ? 90 : 70;

  const score = 0.45 * loadScore + 0.35 * waterScore + 0.20 * dlcSuitability;

  const rationale =
    `${site.name}: cooling load index ${load}; water stress ${waterStress.toFixed(2)}; ` +
    `DLC-ready for ${input.workloadProfile}.`;

  return {
    engineId: "cooling",
    score: round(score),
    factors: {
      coolingLoadIndex: load,
      waterStressIndex: waterStress,
      dlcSuitability,
      recommendedMode: load > 88 ? "liquid-dlc" : "hybrid",
    },
    rationale,
  };
}

function round(x: number, d = 0): number {
  const p = Math.pow(10, d);
  return Math.round(x * p) / p;
}
