import regulationsJson from "@/data/regulations.json";
import type { ComplianceRule, Jurisdiction } from "@/lib/shared/jurisdictions";
import type { M4Output } from "./types";

const JURISDICTIONS = (regulationsJson as { jurisdictions: Jurisdiction[] }).jurisdictions;

function findRule(citeId: string): ComplianceRule | undefined {
  for (const j of JURISDICTIONS) {
    const match = j.rules.find((r) => r.citeId === citeId);
    if (match) return match;
  }
  return undefined;
}

/**
 * Render a compliance brief as markdown. All citations dereference to entries
 * in regulations.json — no free-form URLs.
 */
export function renderComplianceBrief(output: M4Output, synthesis?: {
  decision: string;
  confidence: number;
  dissents: string[];
  key_drivers: string[];
}): string {
  const { input, assessments, routing, primaryFacility, fallbackFacility, generatedAt } = output;
  const primary = routing.find((r) => r.facilityId === primaryFacility);
  const fallback = routing.find((r) => r.facilityId === fallbackFacility);

  const allCiteIds = new Set<string>();
  assessments.forEach((a) => {
    a.blockingCiteIds.forEach((c) => allCiteIds.add(c));
    a.gatingCiteIds.forEach((c) => allCiteIds.add(c));
  });

  const lines: string[] = [
    `# Compliance Brief — Workload Routing`,
    ``,
    `**Prepared by:** DC Control Tower · M4 Sovereignty Grid`,
    `**Generated:** ${new Date(generatedAt).toUTCString()}`,
    `**Workload:** ${input.workloadCategory}`,
    `**Customer data origin:** ${input.customerDataCountries.join(", ") || "—"}`,
    ``,
    `---`,
    ``,
    `## Recommendation`,
    ``,
    synthesis?.decision ??
      (primary
        ? `Route primary to **${primary.facilityName}** (${primary.country}). ` +
          (fallback ? `Fallback: **${fallback.facilityName}**.` : "No viable fallback within the candidate set.")
        : `No facility in the candidate set is viable for this workload without material regulatory remediation.`),
    ``,
    synthesis ? `**Confidence:** ${(synthesis.confidence * 100).toFixed(0)}%` : "",
    ``,
    `## Jurisdiction assessments`,
    ``,
    `| Jurisdiction | Country | Verdict | Blocking | Gating |`,
    `|--------------|---------|---------|----------|--------|`,
    ...assessments.map(
      (a) =>
        `| ${a.jurisdiction} | ${a.country} | **${a.verdict.toUpperCase()}** | ${a.blockingCiteIds.join(", ") || "—"} | ${a.gatingCiteIds.join(", ") || "—"} |`,
    ),
    ``,
    `## Facility routing`,
    ``,
    `| Rank | Facility | Country | Verdict | Fit | Conditions |`,
    `|------|----------|---------|---------|-----|------------|`,
    ...routing.map(
      (r, i) =>
        `| ${i + 1} | ${r.facilityName} | ${r.country} | **${r.verdict.toUpperCase()}** | ${r.fitScore} | ${r.conditionalOn.join(", ") || "—"} |`,
    ),
    ``,
    `## Citations`,
    ``,
    ...(allCiteIds.size === 0
      ? ["_No blocking or gating rules triggered for this workload._"]
      : Array.from(allCiteIds).map((id) => {
          const rule = findRule(id);
          if (!rule) return `- \`${id}\` — (unknown)`;
          return `- \`${id}\` (${rule.severity}): ${rule.text} · [source](${rule.sourceUrl})`;
        })),
    ``,
    synthesis?.key_drivers?.length
      ? [`## Key drivers`, ``, ...synthesis.key_drivers.map((d) => `- ${d}`), ``].join("\n")
      : "",
    synthesis?.dissents?.length
      ? [`## Dissenting views`, ``, ...synthesis.dissents.map((d) => `- ${d}`), ``].join("\n")
      : "",
    `---`,
    ``,
    `*Citations resolve to stable rule IDs maintained in \`data/regulations.json\`. `,
    `Agents are constrained to emit only these IDs; no free-form URLs are permitted.*`,
  ];

  return lines.filter((l) => l !== null && l !== undefined).join("\n");
}
