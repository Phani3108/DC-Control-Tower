/**
 * M4 · Sovereignty Grid — types.
 *
 * Takes a workload profile + list of customer data countries + candidate
 * DAMAC facilities, and produces (a) a per-jurisdiction compliance status,
 * (b) a routing recommendation, and (c) an exportable brief with stable
 * cite_id references.
 */

import type { JurisdictionCode } from "@/lib/shared/jurisdictions";

export type WorkloadCategory =
  | "fintech-inference"
  | "health-training"
  | "public-sector-inference"
  | "general-inference"
  | "general-training";

export interface M4Input {
  workloadCategory: WorkloadCategory;
  customerDataCountries: string[];   // ISO 3166-1 alpha-2 of end-user / data-origin
  candidateFacilityIds: string[];    // DAMAC facilities to route to
}

export type ComplianceVerdict = "clear" | "gated" | "blocked";

export interface JurisdictionAssessment {
  jurisdiction: JurisdictionCode;
  country: string;
  verdict: ComplianceVerdict;
  blockingCiteIds: string[];        // cite_ids with severity=blocking
  gatingCiteIds: string[];
  notes: string;                     // short human-readable summary
}

export interface FacilityRouting {
  facilityId: string;
  facilityName: string;
  country: string;
  verdict: ComplianceVerdict;
  fitScore: number;                  // 0..100
  rationale: string;
  conditionalOn: string[];           // prerequisite cite_ids
}

export interface M4Output {
  input: M4Input;
  assessments: JurisdictionAssessment[];
  routing: FacilityRouting[];
  primaryFacility: string | null;
  fallbackFacility: string | null;
  generatedAt: string;
}
