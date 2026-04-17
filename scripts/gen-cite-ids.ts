#!/usr/bin/env tsx
/**
 * Build-time validator + cite_id allow-list generator.
 *
 *   npm run gen:citations
 *
 * Responsibilities:
 *   1. Load `src/data/citations/citations.json` and confirm every id is unique.
 *   2. Walk every data file in `src/data/**\/*.json` and check that every
 *      `cite_ids` field references a known id.
 *   3. Emit `fastapi/agents/roles/_cite_id_allowlist.md` containing the
 *      full list so agent prompts can ingest it without hard-coding.
 *   4. Fail with non-zero exit code on any problem.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const CITATIONS_FILE = join(ROOT, "src/data/citations/citations.json");
const DATA_DIR = join(ROOT, "src/data");
const ROLES_ALLOWLIST = join(ROOT, "fastapi/agents/roles/_cite_id_allowlist.md");

interface Citation { id: string; title: string; url: string }
interface Registry { citations: Citation[] }

function loadRegistry(): Registry {
  const raw = readFileSync(CITATIONS_FILE, "utf8");
  return JSON.parse(raw);
}

function walkJsonFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".")) continue;
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) walkJsonFiles(p, out);
    else if (entry.endsWith(".json") && !p.includes("agent-cache")) out.push(p);
  }
  return out;
}

function collectCiteIds(obj: unknown, found: Set<string>): void {
  if (Array.isArray(obj)) {
    obj.forEach((x) => collectCiteIds(x, found));
  } else if (obj && typeof obj === "object") {
    const rec = obj as Record<string, unknown>;
    if (Array.isArray(rec.cite_ids)) {
      for (const id of rec.cite_ids) if (typeof id === "string") found.add(id);
    }
    for (const v of Object.values(rec)) collectCiteIds(v, found);
  }
}

function main() {
  const registry = loadRegistry();
  const allowed = new Set(registry.citations.map((c) => c.id));

  // Uniqueness
  if (allowed.size !== registry.citations.length) {
    console.error("[citations] duplicate ids in citations.json");
    process.exit(1);
  }

  // Walk data files
  const files = walkJsonFiles(DATA_DIR).filter((p) => !p.endsWith("/citations.json"));
  const seen = new Set<string>();
  for (const f of files) {
    const data = JSON.parse(readFileSync(f, "utf8"));
    const found = new Set<string>();
    collectCiteIds(data, found);
    for (const id of found) {
      seen.add(id);
      if (!allowed.has(id)) {
        console.error(`[citations] unknown cite_id "${id}" in ${f}`);
        process.exit(2);
      }
    }
  }

  // Emit allow-list for agent roles
  const md = [
    "# Citation allow-list (generated)",
    "",
    "Agents MUST cite only the following ids. Any other string constitutes a validation error.",
    "",
    ...registry.citations.map((c) => `- \`${c.id}\` — ${c.title} (${c.url})`),
    "",
  ].join("\n");
  writeFileSync(ROLES_ALLOWLIST, md, "utf8");

  console.log(`[citations] OK — ${registry.citations.length} ids registered, ${seen.size} in use across ${files.length} data files.`);
}

main();
