# Source Ledger

Every number surfaced in DC Control Tower must cite one of the entries below. The canonical machine-readable copy lives in [`citations.json`](./citations.json) and is loaded by [`src/lib/shared/citations.ts`](../../lib/shared/citations.ts) as a Zod enum. CI enforces that no numeric field ships without a valid `cite_id`.

## How to use

- **In data files** — every record has a `cite_ids: string[]` field naming one or more ids from the registry. Example in `damac-facilities.json`: `"cite_ids": ["damac-press-jakarta-2b"]`.
- **In engine outputs** — every `EngineResult` returns `cite_ids: CiteId[]` so the UI can show per-factor provenance.
- **In agents** — the YAML role prompts inject the full allow-list; agents are instructed to emit only these ids in their JSON output.
- **In the UI** — hover any number to see a tooltip with the source title + link. Numbers citing `internal-estimate-2026` render in amber with an `est.` badge so there is no ambiguity.

## Adding a new citation

1. Append a new entry to `citations.json` with a stable kebab-case `id`, title, publisher, URL, access date, and the list of fields it covers.
2. Run `npm run gen:citations` — this regenerates the Zod enum used by TypeScript and writes a fresh allow-list into each agent's role file.
3. Reference the new id from the data record or engine output.
4. `npm test` will fail if any data file or engine output uses an id not in `citations.json`.

## Registry snapshot

See [`citations.json`](./citations.json) for the full registry. Highlights:

### Facilities & corporate disclosures
- `damac-press-2025-jun`, `damac-press-jakarta-2b`, `damac-press-us-12b`, `damac-leap-ksa-500mw` — primary DAMAC Digital press releases
- `datacenter-map`, `equinix-investor-2025`, `digital-realty-investor-2025`, `ntt-gdc-investor`, `aws-capacity-public`, `oci-dedicated-region` — competitor disclosures

### Hardware
- `nvidia-h100`, `nvidia-h200`, `nvidia-b200`, `nvidia-gb200-nvl72` — NVIDIA product pages (specs)
- `amd-mi300x` — AMD Instinct spec page
- `semianalysis-b200-system-2025` — channel-list pricing reference (Jun 2025)
- `nvidia-dgx-superpod-rev-arch-v2` — reference architecture for cluster density / thermals

### Cost benchmarks
- `cbre-dc-trends-h2-2025` — per-metro rack pricing
- `uptime-salary-survey-2024` — staffing cost decomposition
- `uptime-aos-2024` — annual outage analysis (maintenance opex + M3 failure probability)
- `uptime-global-survey-2024` — PUE benchmarks
- `uptime-tier-standard` — Tier I–IV availability + redundancy targets

### Power / grid
- `iea-weo-2024` — IEA World Energy Outlook 2024 (APS scenario default)
- `iea-weo-2024-nze` — NZE scenario variant
- `ember-electricity-2025` — real-time renewable share
- `eia-open-data` — US-specific prices
- `ferc-n-1-standard` — NERC/FERC N-1 contingency framework

### Risk / geography
- `usgs-seismic-hazard`, `gem-global-quake-model` — seismic PGA
- `telegeography-global-internet-map-2024`, `pch-ix-directory` — IX proximity + latency
- `eiu-democracy-index-2024`, `world-bank-wgi-2024`, `vdem-2024` — political risk composite
- `dcd-regulatory-tracker` — permitting timeline P50/P90

### Regulations (per jurisdiction)
- `ae-pdpl-2021` — UAE Federal Decree-Law 45/2021
- `sa-pdpl-2023`, `sa-sdaia-ai-ethics` — Saudi PDPL + SDAIA ethics
- `eu-ai-act-2024`, `eu-gdpr` — EU AI Act + GDPR (Spain / Greece)
- `tr-kvkk` — Turkey KVKK
- `id-uu-pdp-2022` — Indonesia UU PDP
- `th-pdpa-2019` — Thailand PDPA
- `us-va-cdpa`, `us-ca-ccpa` — US state laws

### Escape hatch
- `internal-estimate-2026` — explicitly flagged placeholder. Use sparingly; the UI shows these in amber with an `est.` badge.

## Refresh cadence

- **Annually** — IEA WEO, Uptime Institute AOS / Global Survey / Salary Survey
- **Quarterly** — CBRE Global DC Trends, DAMAC press release sweep, DCD Regulatory Tracker
- **Daily (via Ember API)** — renewable share, grid carbon intensity
- **On regulatory change** — jurisdiction entries when laws are amended

Record `accessed` date on every entry; run `npm run gen:citations` to refresh the Zod enum after updates.
