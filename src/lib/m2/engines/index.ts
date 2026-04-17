import damacJson from "@/data/damac-facilities.json";
import type { DAMACFacility } from "@/lib/shared/types";
import type { FacilityFit, M2Input, M2Output } from "../types";
import { scoreFacilityFit } from "./facilityMatcher";
import { buildCostBreakdown } from "./costModel";
import { buildSLADraft } from "./slaBuilder";
import { buildCompetitorComparisons } from "./comparison";

const FACILITIES = (damacJson as unknown as { facilities: DAMACFacility[] }).facilities;

export function runM2(input: M2Input): M2Output {
  const { workload } = input;
  const candidates = input.candidateFacilityIds?.length
    ? FACILITIES.filter((f) => input.candidateFacilityIds!.includes(f.id))
    : FACILITIES;

  const fits: FacilityFit[] = candidates
    .map((f) => scoreFacilityFit(f, workload))
    .sort((a, b) => b.fitScore - a.fitScore);

  const primary = fits.find((f) => f.blockers.length === 0) ?? fits[0] ?? null;

  const costs: Record<string, import("../types").CostBreakdown> = {};
  for (const fit of fits.slice(0, 3)) {
    const f = FACILITIES.find((x) => x.id === fit.facilityId);
    if (f) costs[fit.facilityId] = buildCostBreakdown(f, workload);
  }

  const primaryFacility = primary ? FACILITIES.find((f) => f.id === primary.facilityId)! : FACILITIES[0];
  const sla = buildSLADraft(primaryFacility, workload);

  const primaryCost = primary ? costs[primary.facilityId] : null;
  const comparisons = primaryCost
    ? buildCompetitorComparisons(primaryCost.totalUSDPerMWh, workload)
    : [];

  return {
    input,
    fits,
    primaryFacilityId: primary?.facilityId ?? null,
    costs,
    sla,
    comparisons,
    generatedAt: new Date().toISOString(),
  };
}
