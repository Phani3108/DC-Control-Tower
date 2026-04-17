/**
 * Citation system — the single source of truth for "where does this number
 * come from?" across data files, engine outputs, and agent responses.
 *
 * The allow-list is hand-maintained in `src/data/citations/citations.json`
 * and mirrored here as a type so TypeScript catches unknown ids at build
 * time. CI additionally enforces that no data record or engine output ships
 * without a valid `cite_ids` field (see `tests/citations.spec.ts`).
 */

import citationsJson from "@/data/citations/citations.json";

export interface Citation {
  id: string;
  title: string;
  publisher: string;
  url: string;
  accessed: string;        // ISO yyyy-mm-dd
  vintage?: number;
  scenario?: string;
  fields?: string[];
  confidence?: "low" | "medium" | "high";
  notes?: string;
}

interface CitationsPayload {
  lastUpdated: string;
  notes: string;
  citations: Citation[];
}

const REGISTRY = citationsJson as unknown as CitationsPayload;

export const CITATIONS: readonly Citation[] = REGISTRY.citations;

/** Runtime-verifiable allow-list of every valid cite_id. */
export const CITE_IDS: readonly string[] = REGISTRY.citations.map((c) => c.id);

const CITE_ID_SET = new Set(CITE_IDS);

/** Branded string type — use this instead of `string` for cite ids. */
export type CiteId = string & { readonly __brand: "CiteId" };

export function isCiteId(s: string): s is CiteId {
  return CITE_ID_SET.has(s);
}

/** Validate at data-load time. Throws if any id is unknown. */
export function assertCiteIds(ids: readonly string[], context: string): CiteId[] {
  for (const id of ids) {
    if (!CITE_ID_SET.has(id)) {
      throw new Error(
        `[citations] unknown cite_id "${id}" in ${context}. ` +
          `Add it to src/data/citations/citations.json or fix the reference.`,
      );
    }
  }
  return ids as CiteId[];
}

/** Lookup — returns undefined if id is unknown. */
export function getCitation(id: string): Citation | undefined {
  return REGISTRY.citations.find((c) => c.id === id);
}

/** Render a short in-UI label like "CBRE 2025" from an id. */
export function shortLabel(id: string): string {
  const c = getCitation(id);
  if (!c) return id;
  const publisherShort = c.publisher.split(" ").slice(0, 2).join(" ");
  return c.vintage ? `${publisherShort} ${c.vintage}` : publisherShort;
}

/** Is this an explicit internal-estimate placeholder? UI should flag these. */
export function isEstimate(id: string): boolean {
  return id === "internal-estimate-2026";
}

/** Build a newline-separated plain-text citation block for Markdown export. */
export function renderCitationsBlock(ids: readonly string[]): string {
  const unique = Array.from(new Set(ids));
  return unique
    .map((id) => {
      const c = getCitation(id);
      if (!c) return `- \`${id}\` — (unknown citation)`;
      const est = isEstimate(id) ? " _(internal estimate)_" : "";
      return `- \`${id}\` — [${c.title}](${c.url}) · ${c.publisher}${est}`;
    })
    .join("\n");
}
