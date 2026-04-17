import type { Jurisdiction } from "@/lib/shared/jurisdictions";
import type { ComplianceVerdict, WorkloadCategory } from "../types";

/**
 * Given a workload category and a jurisdiction, decide whether the jurisdiction
 * blocks, gates, or permits the workload, and which rules trigger.
 *
 * Rules are pure functions of the jurisdiction's structured metadata — no
 * free-form reasoning. This is the deterministic core; the Opus synthesizer
 * later wraps these facts in narrative.
 */
export function classifyWorkload(
  workload: WorkloadCategory,
  j: Jurisdiction,
  customerDataCountries: string[],
): {
  verdict: ComplianceVerdict;
  blockingCiteIds: string[];
  gatingCiteIds: string[];
  notes: string;
} {
  const blocking: string[] = [];
  const gating: string[] = [];
  const reasons: string[] = [];

  const isFinance = workload === "fintech-inference";
  const isHealth = workload === "health-training";
  const isPublic = workload === "public-sector-inference";
  const hasEUData = customerDataCountries.some((c) =>
    ["ES", "GR", "DE", "FR", "IT", "NL", "BE", "PT", "IE", "LU"].includes(c),
  );

  // Sensitive-sector blocking rules
  if (isHealth && j.dataLocalization.sensitiveSectors.includes("health")) {
    const rule = j.rules.find((r) => r.severity === "blocking");
    if (rule) {
      blocking.push(rule.citeId);
      reasons.push(`health data blocking: ${rule.citeId}`);
    }
  }
  if (isFinance && j.dataLocalization.sensitiveSectors.includes("finance")) {
    const rule = j.rules.find(
      (r) => r.severity === "blocking" && /finance|public/i.test(r.text),
    );
    if (rule) {
      blocking.push(rule.citeId);
      reasons.push(`finance data localization: ${rule.citeId}`);
    }
  }
  if (isPublic && j.dataLocalization.sensitiveSectors.includes("public-sector")) {
    const rule = j.rules.find((r) => r.severity === "blocking");
    if (rule) {
      blocking.push(rule.citeId);
      reasons.push(`public-sector localization: ${rule.citeId}`);
    }
  }

  // Generic personal-data localization
  if (j.dataLocalization.personalData && customerDataCountries.length > 0) {
    // EU customer data flowing through non-EEA jurisdictions creates GDPR exposure
    if (hasEUData && !["ES", "GR"].includes(j.code)) {
      const euRule = j.rules.find((r) => r.citeId === "EU-GDPR-01");
      if (euRule) gating.push(euRule.citeId);
      else {
        // fall back: all gating-severity rules in this jurisdiction
        j.rules.filter((r) => r.severity === "gating").forEach((r) => gating.push(r.citeId));
      }
      reasons.push("EU customer data → adequacy / SCC required");
    }
  }

  // Cross-border approval gating
  if (j.dataLocalization.crossBorderTransferRequiresApproval) {
    j.rules
      .filter((r) => r.severity === "gating" && !gating.includes(r.citeId))
      .forEach((r) => gating.push(r.citeId));
  }

  // AI Act transparency gating for high-risk workloads
  if (j.aiActScope.highRiskDefinition && (isFinance || isHealth || isPublic)) {
    const aiRule = j.rules.find((r) => /AIA|AI Act/i.test(r.text) || r.citeId.startsWith("EU-AIA"));
    if (aiRule && !gating.includes(aiRule.citeId)) gating.push(aiRule.citeId);
    reasons.push("AI Act high-risk obligations apply");
  }

  const verdict: ComplianceVerdict =
    blocking.length > 0 ? "blocked" : gating.length > 0 ? "gated" : "clear";

  const notes =
    verdict === "blocked"
      ? `Blocked: ${reasons.join("; ")}`
      : verdict === "gated"
        ? `Gated: ${reasons.join("; ") || "cross-border approvals required"}`
        : "Clear — no blocking or gating rules triggered.";

  return { verdict, blockingCiteIds: blocking, gatingCiteIds: gating, notes };
}
