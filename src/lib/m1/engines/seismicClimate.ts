import type { CandidateSite } from "@/lib/shared/types";
import type { EngineResult, M1Input } from "../types";

/**
 * Seismic + Climate engine.
 *
 * Combines USGS/GEM peak ground acceleration (g) with a climate risk proxy.
 * Low PGA → high score; high PGA (>0.2 g) is a serious concern for long-lived
 * infrastructure.
 */
export function seismicClimate(site: CandidateSite, _input: M1Input): EngineResult {
  const s = site.priorSignals ?? {};
  const pga = (s as Record<string, number>).seismicPGA ?? 0.05;

  // 0.0 g → 100; 0.3 g → 10
  const seismicScore = Math.max(0, Math.min(100, 100 - (pga / 0.3) * 90));

  // Climate is implicitly captured in cooling engine; here we bake in a
  // baseline uncertainty score so the final score isn't pure seismic.
  const climateUncertaintyPenalty = 8;
  const score = seismicScore - climateUncertaintyPenalty;

  const flag = pga > 0.2 ? " ⚠️ seismic exposure elevated" : "";

  const rationale =
    `${site.name}: PGA ${pga.toFixed(2)} g (USGS/GEM)${flag}. ` +
    `15-yr climate uncertainty baked in.`;

  return {
    engineId: "seismicClimate",
    score: round(Math.max(0, score)),
    factors: {
      seismicPGA: pga,
      seismicScore: round(seismicScore),
      climateUncertaintyPenalty,
    },
    rationale,
  };
}

function round(x: number, d = 0): number {
  const p = Math.pow(10, d);
  return Math.round(x * p) / p;
}
