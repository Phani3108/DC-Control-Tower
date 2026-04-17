# DC Control Tower — Data Sources

Every number in this product is grounded in a public, citable source. Agents are forbidden from emitting free-form URLs; compliance references use stable `cite_id`s defined in `src/data/regulations.json`.

## DAMAC Digital facilities

Inventory in `src/data/damac-facilities.json` is hand-curated from:

- [DAMAC Group press releases](https://www.damacgroup.com/en-ae/d-hub/press-releases/)
- [DAMAC Digital unveil announcement](https://damacdigital.com/our-news/damac-group-unveils-damac-digital-as-global-expansion-accelerates/)
- [$2.3B Jakarta AI-focused DC](https://www.damacgroup.com/en-cn/d-hub/press-releases/edgnex-data-centers-by-damac-announces-2-3-billion-ai-focused-data-center-in-jakarta-indonesia/)
- [$12B US AI capacity secured · itp.net](https://www.itp.net/cloud-data/dubais-damac-secures-capacity-worth-12-billion-for-u-s-ai-data-centres)
- [LEAP Saudi Arabia 2025 · 500 MW future announcement](https://www.damacgroup.com/en-ae/d-hub/press-releases/edgnex-participates-at-leap-saudi-arabia-2025-announces-500mw-future/)
- [Cognizant strategic partnership](https://www.prnewswire.com/news-releases/damac-group-works-with-cognizant-as-strategic-partner-to-transform-it-operations-and-elevate-customer-experience-302683570.html)

_Update cadence: quarterly. Source URLs are preserved per-facility in the JSON._

## GPU specifications

`src/data/gpu-specs.json` — per-GPU TDP, memory, rack density:

- NVIDIA [H100](https://www.nvidia.com/en-us/data-center/h100/) / [H200](https://www.nvidia.com/en-us/data-center/h200/) / [DGX B200](https://www.nvidia.com/en-us/data-center/dgx-b200/) / [GB200 NVL72](https://www.nvidia.com/en-us/data-center/gb200-nvl72/)
- AMD [Instinct MI300X](https://www.amd.com/en/products/accelerators/instinct/mi300/mi300x.html)

## Jurisdictions and compliance

`src/data/regulations.json` — plain-English summaries of each rule plus a stable `cite_id` that agents must reference:

- UAE **PDPL** — [Federal Decree-Law 45/2021](https://u.ae/en/information-and-services/justice-safety-and-the-law/data-protection-regulations)
- Saudi Arabia **PDPL + SDAIA** — [SDAIA personal data regulations](https://sdaia.gov.sa/en/SDAIA/about/Files/PersonalDataEnglish.pdf)
- EU **AI Act** — [artificialintelligenceact.eu](https://artificialintelligenceact.eu/)
- EU **GDPR** — [gdpr.eu](https://gdpr.eu/)
- Turkey **KVKK** — [kvkk.gov.tr](https://www.kvkk.gov.tr/)
- Indonesia **UU PDP** — [peraturan.bpk.go.id](https://peraturan.bpk.go.id/)
- Thailand **PDPA** — [pdpc.or.th](https://www.pdpc.or.th/)
- US Virginia **CDPA** — [law.lis.virginia.gov](https://law.lis.virginia.gov/vacodefull/title59.1/chapter53/)
- US California **CCPA/CPRA** — [oag.ca.gov/privacy/ccpa](https://oag.ca.gov/privacy/ccpa)

## Third-party data APIs (optional live fetch)

Proxied via Next.js `/api/data/{source}/…` to avoid CORS.

| Source | API | Usage |
|---|---|---|
| **Ember Electricity Data Explorer** | [ember-energy.org/data/api](https://ember-energy.org/data/api/) | Renewable-mix per country (M1, M4) |
| **IEA** | [iea.org/data-and-statistics](https://www.iea.org/data-and-statistics/) | Wholesale electricity price trajectories (M1, M2) |
| **US EIA** | [eia.gov/opendata](https://www.eia.gov/opendata/) | Real-time US electricity prices (M1, M2) |
| **USGS / GEM** | [earthquake.usgs.gov](https://earthquake.usgs.gov/) · [globalquakemodel.org](https://www.globalquakemodel.org/) | Seismic hazard per candidate site (M1) |
| **Packet Clearing House** | [pch.net/resources/data](https://www.pch.net/resources/data) | IX peering → latency (M1, M2) |
| **Uptime Institute** | [uptimeinstitute.com/tier-certification](https://uptimeinstitute.com/tier-certification) | Tier/PUE reference (embedded as static data) |
| **Our World in Data · Energy** | [github.com/owid/energy-data](https://github.com/owid/energy-data/) | Country-level energy generation mix (M1, M4) |

## Industry research (not live-fetched; referenced in engine reasoning)

- [Castle Rock Digital — AI/HPC site selection](https://www.castlerockdigital.com/insights/data-center-site-selection-ai-hpc)
- [Ramboll — site-selection criteria](https://www.ramboll.com/en-us/insights/resilient-societies-and-liveability/data-center-site-selection-criteria)
- [Introl — H100 / H200 / B200 guide](https://introl.com/blog/h100-vs-h200-vs-b200-choosing-the-right-nvidia-gpus-for-your-ai-workload)
- [NVIDIA DGX SuperPOD design](https://docs.nvidia.com/dgx-superpod/design-guides/dgx-superpod-data-center-design-h100/latest/cooling.html)
- [Modulos — Middle East AI regulation](https://www.modulos.ai/middle-east-ai-regulations/)
