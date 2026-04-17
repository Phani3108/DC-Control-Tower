/**
 * Canonical jurisdiction model.
 *
 * Used by M1 (can we *build* here?) and M4 (can this *workload* run here?).
 * The same `Jurisdiction` object drives both questions — don't fork this.
 *
 * Rules are keyed by stable `cite_id`s. The Opus compliance synthesizer in
 * FastAPI is constrained to emit only these IDs (no free-form URLs) to
 * prevent citation hallucination.
 */

export type JurisdictionCode =
  | "AE"     // UAE (PDPL)
  | "SA"     // Saudi Arabia (PDPL + SDAIA)
  | "ES"     // Spain (EU AI Act + AESIA)
  | "GR"     // Greece (EU AI Act)
  | "TR"     // Turkey (KVKK)
  | "ID"     // Indonesia (UU PDP)
  | "TH"     // Thailand (PDPA)
  | "US-VA"  // US Virginia (CDPA)
  | "US-CA"; // US California (CCPA)

export type SovereigntyTier = "restrictive" | "moderate" | "light" | "permissive";

export interface ComplianceRule {
  citeId: string;               // stable; referenced by agents
  text: string;                 // ≤ 280 chars plain-English summary
  sourceUrl: string;            // citable source
  severity: "blocking" | "gating" | "informational";
}

export interface Jurisdiction {
  code: JurisdictionCode;
  country: string;
  primaryRegulations: string[]; // ["PDPL", "SDAIA AI Ethics"]
  sovereigntyTier: SovereigntyTier;
  dataLocalization: {
    personalData: boolean;
    sensitiveSectors: string[];   // ["health", "finance"]
    modelWeights: boolean;        // are weights considered regulated assets?
    crossBorderTransferRequiresApproval: boolean;
  };
  aiActScope: {
    highRiskDefinition: boolean;
    transparencyObligations: boolean;
    supervisoryBody?: string;
  };
  maxFine: { currency: string; amount: number; ref: string };
  rules: ComplianceRule[];
  notes?: string;
}

// Friendliness ranking (derived from research brief):
// US > UAE > Indonesia > Turkey > Spain/Greece > Saudi Arabia
export const SOVEREIGNTY_ORDER: JurisdictionCode[] = [
  "US-VA", "US-CA", "AE", "ID", "TH", "TR", "ES", "GR", "SA",
];

export function sovereigntyRank(code: JurisdictionCode): number {
  const idx = SOVEREIGNTY_ORDER.indexOf(code);
  return idx === -1 ? SOVEREIGNTY_ORDER.length : idx;
}
