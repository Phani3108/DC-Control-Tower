import type { CandidateSite } from "@/lib/shared/types";
import type { EngineResult, M1Input } from "../types";
import type { Jurisdiction, JurisdictionCode } from "@/lib/shared/jurisdictions";
import { sovereigntyRank } from "@/lib/shared/jurisdictions";
import regulationsJson from "@/data/regulations.json";

interface RegulationsPayload {
  jurisdictions: Jurisdiction[];
}

const JURISDICTIONS = (regulationsJson as unknown as RegulationsPayload).jurisdictions;

const COUNTRY_TO_JURISDICTION: Record<string, JurisdictionCode> = {
  AE: "AE",
  SA: "SA",
  ES: "ES",
  GR: "GR",
  TR: "TR",
  ID: "ID",
  TH: "TH",
  US: "US-VA",
  MY: "ID",
};

/**
 * Sovereignty — re-uses the shared jurisdictions registry (also used by M4).
 * Produces a 0..100 score from the jurisdiction's sovereigntyTier plus workload-
 * specific penalties and a count of blocking rules.
 */
export function sovereignty(site: CandidateSite, input: M1Input): EngineResult {
  const jCode = COUNTRY_TO_JURISDICTION[site.countryCode];
  const j = JURISDICTIONS.find((x) => x.code === jCode);

  if (!j) {
    return {
      engineId: "sovereignty",
      score: 50,
      factors: { country: site.countryCode, note: "no jurisdiction match" },
      rationale: `${site.name}: no jurisdiction profile registered; default 50.`,
      cite_ids: ["internal-estimate-2026"],
    };
  }

  const rank = sovereigntyRank(j.code);
  const tierScore = 100 - (rank / 8) * 70;

  let penalty = 0;
  if (input.workloadProfile === "sovereign-inference" && j.sovereigntyTier === "restrictive") penalty += 10;
  if (j.dataLocalization.modelWeights) penalty += 8;
  if (j.dataLocalization.crossBorderTransferRequiresApproval) penalty += 6;

  const score = Math.max(0, tierScore - penalty);

  const blocking = j.rules.filter((r) => r.severity === "blocking").map((r) => r.citeId);

  return {
    engineId: "sovereignty",
    score: Math.round(score * 10) / 10,
    factors: {
      jurisdiction: j.code,
      tier: j.sovereigntyTier,
      blockingRuleCount: blocking.length,
      requiresCrossBorderApproval: j.dataLocalization.crossBorderTransferRequiresApproval,
    },
    rationale: `${j.country}: ${j.sovereigntyTier}; ${j.primaryRegulations.slice(0, 2).join(" + ")}. ${blocking.length ? `Blocking: ${blocking.join(", ")}` : "No blocking rules."}`,
    cite_ids: j.cite_ids ?? [],
  };
}
