import type { CandidateSite } from "@/lib/shared/types";
import type { EngineResult, M1Input } from "../types";
import { sovereigntyRank } from "@/lib/shared/jurisdictions";
import regulationsJson from "@/data/regulations.json";
import type { Jurisdiction, JurisdictionCode } from "@/lib/shared/jurisdictions";

interface RegulationsPayload {
  jurisdictions: Jurisdiction[];
}

const JURISDICTIONS = (regulationsJson as RegulationsPayload).jurisdictions;

// Map country code to primary jurisdiction for this site.
const COUNTRY_TO_JURISDICTION: Record<string, JurisdictionCode> = {
  AE: "AE",
  SA: "SA",
  ES: "ES",
  GR: "GR",
  TR: "TR",
  ID: "ID",
  TH: "TH",
  US: "US-VA",
  MY: "ID", // proxy — Malaysia PDPA closer to ID tier
};

/**
 * Sovereignty engine.
 *
 * Draws from the shared Jurisdictions data model (also used by M4). Returns
 * the jurisdiction's `sovereigntyTier` expressed as a 0..100 score plus a
 * list of potentially-blocking rules from `regulations.json`.
 */
export function sovereignty(site: CandidateSite, input: M1Input): EngineResult {
  const jCode = COUNTRY_TO_JURISDICTION[site.countryCode];
  const j = JURISDICTIONS.find((x) => x.code === jCode);

  if (!j) {
    return {
      engineId: "sovereignty",
      score: 50,
      factors: { country: site.countryCode, note: "no jurisdiction match — default 50" },
      rationale: `${site.name}: no jurisdiction profile; using default.`,
    };
  }

  // 9 jurisdictions ranked permissive → restrictive. Convert to 0..100.
  const rank = sovereigntyRank(j.code);          // 0..8 (lower = more permissive)
  const tierScore = 100 - (rank / 8) * 70;       // 100 → 30 across the ladder

  // Workload-specific penalties
  let penalty = 0;
  if (input.workloadProfile === "sovereign-inference" && j.sovereigntyTier === "restrictive") {
    penalty += 10; // restrictive regimes can still host inference but with gating
  }
  if (j.dataLocalization.modelWeights) penalty += 8;
  if (j.dataLocalization.crossBorderTransferRequiresApproval) penalty += 6;

  const score = Math.max(0, tierScore - penalty);

  const blockingRules = j.rules.filter((r) => r.severity === "blocking").map((r) => r.citeId);

  const rationale =
    `${site.name} (${j.country}): tier=${j.sovereigntyTier}; ` +
    `${j.primaryRegulations.slice(0, 2).join(" + ")}. ` +
    (blockingRules.length ? `Blocking rules: ${blockingRules.join(", ")}` : "No blocking rules.");

  return {
    engineId: "sovereignty",
    score: round(score),
    factors: {
      jurisdiction: j.code,
      tier: j.sovereigntyTier,
      blockingRuleCount: blockingRules.length,
      requiresCrossBorderApproval: j.dataLocalization.crossBorderTransferRequiresApproval,
    },
    rationale,
  };
}

function round(x: number, d = 0): number {
  const p = Math.pow(10, d);
  return Math.round(x * p) / p;
}
