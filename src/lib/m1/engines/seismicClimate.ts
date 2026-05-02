import type { CandidateSite } from "@/lib/shared/types";
import type { EngineResult, M1Input } from "../types";

/**
 * Seismic + Climate engine — USGS National Seismic Hazard Model + GEM global.
 * PGA 10% in 50 yr; lower is better. Climate uncertainty baked in as a
 * flat 8-point penalty pending per-site flood/wildfire modelling.
 */
export function seismicClimate(site: CandidateSite, _input: M1Input): EngineResult {
  void _input;
  const s = (site.priorSignals ?? {}) as Record<string, number>;
  const pga = s.seismicPGA ?? 0.05;
  const floodReturn = s.floodReturnPeriod ?? 100;

  const seismicScore = Math.max(0, Math.min(100, 100 - (pga / 0.3) * 90));
  const climatePenalty = floodReturn < 100 ? 12 : 8;
  const score = Math.max(0, seismicScore - climatePenalty);

  const rationale =
    `PGA ${pga.toFixed(2)} g (USGS/GEM), flood return ${floodReturn} yr. ` +
    `${pga > 0.2 ? "⚠ elevated seismic exposure" : "seismic exposure tolerable"}.`;

  return {
    engineId: "seismicClimate",
    score: Math.round(score * 10) / 10,
    factors: {
      seismicPGA: pga,
      floodReturnPeriodYears: floodReturn,
      seismicScore: Math.round(seismicScore),
      climatePenalty,
    },
    rationale,
    cite_ids: ["usgs-seismic-hazard", "gem-global-quake-model"],
  };
}
