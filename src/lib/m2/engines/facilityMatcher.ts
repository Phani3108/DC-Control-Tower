import type { DAMACFacility } from "@/lib/shared/types";
import type { FacilityFit, M2Workload } from "../types";
import { computeRackLayout } from "./rackDensity";

/**
 * Score a single facility against a workload. Six sub-dimensions,
 * each 0..100, combined into an overall fitScore.
 */
export function scoreFacilityFit(facility: DAMACFacility, workload: M2Workload): FacilityFit {
  const layout = computeRackLayout(workload.gpu, workload.clusterMW);

  // --- powerFit: available MW capacity vs ask ---
  // Treats operational + under-construction as "usable within 18 months"
  const availableMW = facility.operationalMW + (facility.status === "planned" ? 0 : facility.capacityMW - facility.operationalMW);
  const powerFit = Math.max(
    0,
    Math.min(100, (availableMW / Math.max(1, workload.clusterMW)) * 100),
  );

  // --- rackDensityFit: does the facility support this kW/rack? ---
  const rackDensityFit =
    facility.maxRackDensityKW >= layout.kWPerRack
      ? 100
      : Math.max(0, (facility.maxRackDensityKW / layout.kWPerRack) * 100);

  // --- latencyFit: heuristic by country proximity to customer geography ---
  const latencyFit = estimateLatencyFit(facility, workload);

  // --- coolingFit: does the facility support the required cooling mode? ---
  const coolingFit = scoreCoolingFit(facility, layout.coolingMode);

  // --- sustainabilityFit: PUE target match ---
  let sustainabilityFit = 100;
  if (workload.sustainability?.pueMax && facility.puE > workload.sustainability.pueMax) {
    const gap = facility.puE - workload.sustainability.pueMax;
    sustainabilityFit = Math.max(0, 100 - gap * 120);
  }

  // --- budgetFit: depends on power cost of country; anchored at $140/MWh baseline ---
  const budgetFit = scoreBudgetFit(facility, workload);

  const overall =
    0.25 * powerFit +
    0.20 * rackDensityFit +
    0.15 * latencyFit +
    0.15 * coolingFit +
    0.10 * sustainabilityFit +
    0.15 * budgetFit;

  const blockers: string[] = [];
  if (availableMW < workload.clusterMW * 0.5) blockers.push("power-capacity-short");
  if (facility.maxRackDensityKW < layout.kWPerRack * 0.9) blockers.push("rack-density-insufficient");
  if (workload.sustainability?.pueMax && facility.puE > workload.sustainability.pueMax + 0.05) {
    blockers.push("PUE-misses-sustainability-target");
  }

  const recommendedPhasing = buildPhasing(facility, workload);
  const rationale =
    `${facility.name}: ${layout.rackCount} racks @ ${layout.kWPerRack} kW/rack (${layout.coolingMode}). ` +
    `Available ${availableMW} MW / ${workload.clusterMW} MW ask. PUE ${facility.puE}.`;

  return {
    facilityId: facility.id,
    facilityName: facility.name,
    country: facility.country,
    fitScore: round(overall, 1),
    factors: {
      powerFit: round(powerFit),
      rackDensityFit: round(rackDensityFit),
      latencyFit: round(latencyFit),
      coolingFit: round(coolingFit),
      sustainabilityFit: round(sustainabilityFit),
      budgetFit: round(budgetFit),
    },
    recommendedPhasing,
    rationale,
    rackCount: layout.rackCount,
    kWPerRack: layout.kWPerRack,
    coolingMode: layout.coolingMode,
    blockers,
  };
}

function estimateLatencyFit(facility: DAMACFacility, workload: M2Workload): number {
  if (!workload.customerGeography || !workload.latencySLAms) return 70;
  const sameCountry = facility.countryCode === workload.customerGeography;
  const sameRegion =
    (facility.region === "US" && workload.customerGeography === "US") ||
    (facility.region === "EU" && ["ES", "GR", "DE", "FR", "IT", "NL", "PT", "IE"].includes(workload.customerGeography)) ||
    (facility.region === "APAC" && ["ID", "TH", "MY", "SG", "JP"].includes(workload.customerGeography)) ||
    (facility.region === "ME" && ["AE", "SA", "QA", "BH", "KW"].includes(workload.customerGeography));

  const assumedRTT = sameCountry ? 8 : sameRegion ? 25 : 120;
  if (assumedRTT <= workload.latencySLAms) return 100;
  return Math.max(0, 100 - (assumedRTT - workload.latencySLAms) * 4);
}

function scoreCoolingFit(facility: DAMACFacility, required: string): number {
  if (facility.coolingType === required) return 100;
  if (facility.coolingType === "hybrid" && required === "air") return 90;
  if (facility.coolingType === "liquid-dlc" && required === "hybrid") return 95;
  if (facility.coolingType === "liquid-dlc" && required === "air") return 85;
  if (facility.coolingType === "air" && required === "liquid-dlc") return 30;
  if (facility.coolingType === "air" && required === "hybrid") return 50;
  return 60;
}

const COUNTRY_PRICE_BASELINE_USDMWh: Record<string, number> = {
  US: 85, AE: 95, SA: 72, ID: 90, TH: 115, MY: 80, ES: 125, GR: 135, TR: 145,
};

function scoreBudgetFit(facility: DAMACFacility, workload: M2Workload): number {
  const estimated = COUNTRY_PRICE_BASELINE_USDMWh[facility.countryCode] ?? 130;
  const budget = workload.budgetUSDPerMWhMax ?? 150;
  if (estimated <= budget) return 100;
  return Math.max(0, 100 - (estimated - budget) * 2);
}

function buildPhasing(facility: DAMACFacility, workload: M2Workload): string {
  const p1 = Math.min(workload.clusterMW, Math.max(10, facility.operationalMW, workload.clusterMW / 2));
  const remaining = Math.max(0, workload.clusterMW - p1);
  if (remaining <= 0) return `Phase 1: ${Math.round(p1)} MW at ${facility.name}, available ~${facility.commissioningDate ?? "immediate"}.`;
  return (
    `Phase 1: ${Math.round(p1)} MW at ${facility.name} (${facility.commissioningDate ?? "immediate"}); ` +
    `Phase 2: ${Math.round(remaining)} MW at ramp milestone.`
  );
}

function round(x: number, d = 0): number {
  const p = Math.pow(10, d);
  return Math.round(x * p) / p;
}
