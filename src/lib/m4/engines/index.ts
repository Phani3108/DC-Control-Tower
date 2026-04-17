import regulationsJson from "@/data/regulations.json";
import damacJson from "@/data/damac-facilities.json";
import type { DAMACFacility } from "@/lib/shared/types";
import type { Jurisdiction, JurisdictionCode } from "@/lib/shared/jurisdictions";
import type {
  ComplianceVerdict,
  FacilityRouting,
  JurisdictionAssessment,
  M4Input,
  M4Output,
} from "../types";
import { classifyWorkload } from "./workloadClassifier";

const JURISDICTIONS = (regulationsJson as { jurisdictions: Jurisdiction[] }).jurisdictions;
const FACILITIES = (damacJson as unknown as { facilities: DAMACFacility[] }).facilities;

const COUNTRY_TO_JURISDICTION: Record<string, JurisdictionCode> = {
  AE: "AE",
  SA: "SA",
  ES: "ES",
  GR: "GR",
  TR: "TR",
  ID: "ID",
  TH: "TH",
  US: "US-VA",
};

const VERDICT_TO_SCORE: Record<ComplianceVerdict, number> = {
  clear: 95,
  gated: 65,
  blocked: 10,
};

export function runM4(input: M4Input): M4Output {
  // Evaluate every jurisdiction touched by candidate facilities OR customer data
  const facilities = FACILITIES.filter((f) => input.candidateFacilityIds.includes(f.id));
  const touchedCodes = new Set<JurisdictionCode>();
  facilities.forEach((f) => {
    const jc = COUNTRY_TO_JURISDICTION[f.countryCode];
    if (jc) touchedCodes.add(jc);
  });
  input.customerDataCountries.forEach((c) => {
    const jc = COUNTRY_TO_JURISDICTION[c];
    if (jc) touchedCodes.add(jc);
  });

  const assessments: JurisdictionAssessment[] = Array.from(touchedCodes)
    .map((code) => JURISDICTIONS.find((j) => j.code === code))
    .filter((j): j is Jurisdiction => !!j)
    .map((j) => {
      const { verdict, blockingCiteIds, gatingCiteIds, notes } = classifyWorkload(
        input.workloadCategory,
        j,
        input.customerDataCountries,
      );
      return {
        jurisdiction: j.code,
        country: j.country,
        verdict,
        blockingCiteIds,
        gatingCiteIds,
        notes,
      };
    });

  // Route each facility
  const routing: FacilityRouting[] = facilities.map((f) => {
    const jCode = COUNTRY_TO_JURISDICTION[f.countryCode];
    const assessment = assessments.find((a) => a.jurisdiction === jCode);
    const verdict = assessment?.verdict ?? "clear";
    const fitScore = VERDICT_TO_SCORE[verdict];
    const conditional = [
      ...(assessment?.blockingCiteIds ?? []),
      ...(assessment?.gatingCiteIds ?? []),
    ];
    const rationale =
      verdict === "blocked"
        ? `Blocked at ${f.country}: ${assessment?.blockingCiteIds.join(", ")}.`
        : verdict === "gated"
          ? `${f.country}: viable conditional on ${conditional.join(", ")}.`
          : `${f.country}: clear for ${input.workloadCategory}.`;

    return {
      facilityId: f.id,
      facilityName: f.name,
      country: f.country,
      verdict,
      fitScore,
      rationale,
      conditionalOn: conditional,
    };
  });

  // Rank routing by (non-blocked first, then by fitScore desc)
  routing.sort((a, b) => {
    if (a.verdict === "blocked" && b.verdict !== "blocked") return 1;
    if (b.verdict === "blocked" && a.verdict !== "blocked") return -1;
    return b.fitScore - a.fitScore;
  });

  const primary = routing.find((r) => r.verdict !== "blocked") ?? null;
  const fallback = routing.filter((r) => r !== primary && r.verdict !== "blocked")[0] ?? null;

  return {
    input,
    assessments,
    routing,
    primaryFacility: primary?.facilityId ?? null,
    fallbackFacility: fallback?.facilityId ?? null,
    generatedAt: new Date().toISOString(),
  };
}
