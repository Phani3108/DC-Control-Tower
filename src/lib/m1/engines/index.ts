import type { CandidateSite } from "@/lib/shared/types";
import candidateSitesJson from "@/data/candidate-sites.json";
import type {
  EngineId,
  EngineResult,
  EngineWeights,
  M1Input,
  M1Output,
  SiteScorecard,
} from "../types";
import { DEFAULT_WEIGHTS } from "../types";
import { estimate5yrTCO } from "../tco";
import { powerAvailability } from "./powerAvailability";
import { powerCost } from "./powerCost";
import { cooling } from "./cooling";
import { latency } from "./latency";
import { sovereignty } from "./sovereignty";
import { seismicClimate } from "./seismicClimate";
import { incentives } from "./incentives";
import { talent } from "./talent";
import { financeRisk } from "./financeRisk";
import { hyperscalerProximity } from "./hyperscalerProximity";

export const ENGINE_REGISTRY: Record<EngineId, (site: CandidateSite, input: M1Input) => EngineResult> = {
  powerAvailability,
  powerCost,
  cooling,
  latency,
  sovereignty,
  seismicClimate,
  incentives,
  talent,
  financeRisk,
  hyperscalerProximity,
};

function loadSites(): CandidateSite[] {
  // JSON is typed loosely by TS (number[] instead of [number, number] tuples);
  // we double-cast to the runtime-correct type.
  return (candidateSitesJson as unknown as { sites: CandidateSite[] }).sites;
}

/** Pure — runs all 10 engines across all candidate sites and ranks them. */
export function runAllEngines(input: M1Input): M1Output {
  const allSites = loadSites();
  const sites = input.candidateSiteIds.length
    ? allSites.filter((s) => input.candidateSiteIds.includes(s.id))
    : allSites;

  const weights: EngineWeights = {
    ...DEFAULT_WEIGHTS[input.workloadProfile],
    ...(input.weights ?? {}),
  };

  const scorecards: SiteScorecard[] = sites.map((site) => {
    const engineResults = {} as Record<EngineId, EngineResult>;
    let weightedSum = 0;
    let totalWeight = 0;
    for (const [engineId, fn] of Object.entries(ENGINE_REGISTRY) as [
      EngineId,
      (s: CandidateSite, i: M1Input) => EngineResult,
    ][]) {
      const r = fn(site, input);
      engineResults[engineId] = r;
      const w = weights[engineId] ?? 0;
      weightedSum += r.score * w;
      totalWeight += w;
    }
    const overall = totalWeight > 0 ? weightedSum / totalWeight : 0;

    const blocking: string[] = [];
    if (engineResults.sovereignty.score < 35) blocking.push("sovereignty-risk");
    if (engineResults.seismicClimate.score < 40) blocking.push("seismic-exposure");
    if (engineResults.powerAvailability.score < 40) blocking.push("power-constrained");

    return {
      site,
      engineResults,
      overallScore: round(overall, 1),
      rank: 0, // set after sort
      tco5yrUSDm: estimate5yrTCO(site, input),
      blockingFlags: blocking,
    };
  });

  // Sort descending by overall
  scorecards.sort((a, b) => b.overallScore - a.overallScore);
  scorecards.forEach((c, i) => (c.rank = i + 1));

  return {
    input,
    scorecards,
    weightsUsed: weights,
    topSite: scorecards[0]?.site.id ?? "",
    runnerUp: scorecards[1]?.site.id ?? "",
    generatedAt: new Date().toISOString(),
  };
}

function round(x: number, d = 0): number {
  const p = Math.pow(10, d);
  return Math.round(x * p) / p;
}
