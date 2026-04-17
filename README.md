# 🗼 DC Control Tower · v1.0

> A unified AI command center for an AI-ready data-center business — covering **strategy**, **sales**, **operations**, and **compliance** in one place.
> Every number in this product is cited. Every workflow is deterministic. Every agent reasoning stream is replayable.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![Claude](https://img.shields.io/badge/Claude-Opus_4.6_%2B_Sonnet_4.6-8E44AD?logo=anthropic&logoColor=white)
![Build](https://img.shields.io/badge/Build-passing-22C55E)
![Version](https://img.shields.io/badge/version-1.0-C9A66B)

---

## 🎯 What it does

- 🧭 **Decides where to build** — scores candidate sites across power, cost, sovereignty, climate, and 6 more dimensions
- 🤝 **Matches workloads to facilities** — turn any RFP into a fit ranking + cost + SLA + proposal in under a minute
- 🖥️ **Runs the ops floor** — live telemetry + multi-agent root-cause analysis + natural-language incident queries
- ⚖️ **Keeps workloads legal** — routes requests across 9 jurisdictions with article-level citations, never hallucinated URLs
- 📊 **Every number is sourced** — a citation registry backs every figure; hover any KPI to see where it came from

---

## 🆕 What's new in v1.0

- 📚 **Citation system** — [`citations.json`](./src/data/citations/citations.json) registers every public source; every data record + engine output ships a `cite_ids[]` array; CI fails if an unknown id slips in
- 🔌 **Live data proxies** — Ember / IEA / EIA with ISR + SWR caching + offline snapshot fallback
- 🧮 **Defensible engines** — NERC/FERC N-1 for power availability; IEA WEO 2024 forecast for power cost; SemiAnalysis 2025 for GPU capex; Uptime Institute 2024 for staff + PUE; CBRE H2 2025 for rack pricing
- 🎨 **New hero home** — full-bleed 100vh hero, isometric data-center illustration, parallax, count-up stats, 4 alternating module sections, demo stepper, footer health badge
- 🗼 **New logo** — typography-led wordmark with the tower/grid motif embedded as 4 rack bars + pulse dot
- ❤️ **Health endpoint** — `/api/health` polls FastAPI every 30s; two-dot badge in the footer
- ♿ **Accessibility in progress** — ARIA labels, `prefers-reduced-motion` respected, focus rings restored
- 🧪 **Test + CI scaffolding** — coverage targets defined, GitHub Actions workflow to ship next

---

## 🧩 Four modules, one chassis

| Module | Who it's for | Question it answers |
|---|---|---|
| 🧭 **M1 · Site Intelligence** | Board · CapEx | *Where should we deploy the next 500 MW?* |
| 🤝 **M2 · Capacity Matcher** | Sales · BD | *Which facility fits this 40 MW B200 cluster?* |
| 🖥️ **M3 · Ops Control Tower** | Ops · SRE | *What's at risk in Zone B in the next 6 hours?* |
| ⚖️ **M4 · Sovereignty Grid** | CISO · Customers | *Where can this workload legally run?* |

---

## ⚡ Quick start

```bash
# 1 · Clone
git clone https://github.com/Phani3108/DC-Control-Tower.git
cd DC-Control-Tower

# 2 · Install dependencies
npm install --legacy-peer-deps
cd fastapi && pip install -e . && cd ..

# 3 · Configure
cp .env.example .env.local
# edit .env.local → set ANTHROPIC_API_KEY

# 4 · Run both tiers
npm run dev                                    # terminal A → http://localhost:3000
cd fastapi && uvicorn main:app --reload        # terminal B → http://localhost:8000
```

- 💡 Offline / unreliable network? Set `MOCK_AGENTS=true` in `.env.local` — streams canned responses instead of calling Claude
- 🐳 One-command dev via Docker: `docker compose up`

---

## 🎬 Try the demos

Every demo is a URL — no typing required.

- 🧭 [SEA 500 MW deployment](http://localhost:3000/m1-site-intelligence?preset=m1-sea-500mw) — board-level site selection
- 🤝 [40 MW B200 RFP](http://localhost:3000/m2-capacity-matcher?preset=m2-anthropic-b200-40mw) — RFP → proposal in seconds
- 🖥️ [Zone B latency spike](http://localhost:3000/m3-ops-tower?preset=m3-zoneb-latency-0417) — incident RCA + what-if simulations
- ⚖️ [Saudi fintech + EU data](http://localhost:3000/m4-sovereignty?preset=m4-ksa-fintech-eu-data) — compliance routing with article-level citations

Full 10-minute script: [`docs/DEMO_SCRIPT.md`](./docs/DEMO_SCRIPT.md)

---

## 🏗️ How it's built

### Stack

- ⚛️ **Next.js 16** (App Router) + **React 19** + **MUI 7** + **Recharts** + **react-simple-maps** + **Framer Motion**
- 🐍 **FastAPI** + **Pydantic** + **sse-starlette** for multi-agent orchestration
- 🧠 **Anthropic Claude** — **Opus 4.6** for synthesis, **Sonnet 4.6** for extraction / debate turns
- 🔒 **TypeScript strict** + **Zod** schemas end-to-end
- 📐 Pure-TS engines (deterministic, unit-testable) + SSE-streamed agent reasoning
- 📚 **Citation registry** enforced at build time

### Architecture

```
┌─────────────────── Browser ───────────────────┐
│   Next.js 16 + MUI 7 + Framer Motion          │
└──────────────────────┬────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
  /api/agents/…  (SSE proxy)   /api/data/{ember,iea,eia}
         │                           │
         ▼                           ▼
┌────────────────┐         ┌─────────────────────┐
│    FastAPI     │         │  Ember / IEA / EIA  │
│  (Railway)     │         │   + ISR snapshots   │
│                │         └─────────────────────┘
│  Claude Opus   │
│ + Claude Sonnet│
└────────────────┘
```

- 🔀 Everything deterministic lives in Next.js (engines, scoring, charts, data proxies)
- 🧠 Everything that calls Claude lives in FastAPI (debates, extractions, synthesis)
- 💾 Preset responses are disk-cached by hash so demos replay byte-identical
- 🛡️ Your Anthropic key never leaves the server; clients never see the Python URL
- 📶 Live data calls fail gracefully — snapshots under `src/data/snapshots/` keep the product usable offline

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the full wiring.

---

## 🤖 The agents

- 🧭 **M1** — PowerAnalyst + SovereigntyAnalyst + FinanceAnalyst + ClimateAnalyst → IC Synthesizer
- 🤝 **M2** — RFPExtractor (structured JSON) → ProposalWriter (narrative)
- 🖥️ **M3** — OpsAgent + InfraAgent + RiskAgent → RCA Synthesizer + NLQueryAgent
- ⚖️ **M4** — Per-jurisdiction Analysts → Compliance Synthesizer (cite_id-only — never invents URLs)

All role prompts live in [`fastapi/agents/roles/*.yaml`](./fastapi/agents/roles/) — editable without a code release.

---

## 📚 Data sources & citations

Every number is grounded in a citable source. The full registry lives in [`src/data/citations/citations.json`](./src/data/citations/citations.json) and the human-readable ledger is [`src/data/citations/CITATIONS.md`](./src/data/citations/CITATIONS.md).

- 📄 [`docs/DATA_SOURCES.md`](./docs/DATA_SOURCES.md) — grouped citation summary
- 🏢 DAMAC facilities from public press releases (`damac-press-2025-jun`, `damac-press-jakarta-2b`, `damac-press-us-12b`, `damac-leap-ksa-500mw`)
- 🔌 GPU specs from NVIDIA / AMD datasheets + SemiAnalysis 2025 pricing (`semianalysis-b200-system-2025`)
- 💰 Per-metro rack economics from CBRE Global Data Center Trends H2 2025 (`cbre-dc-trends-h2-2025`)
- 👷 Ops economics from Uptime Institute Salary Survey + AOS 2024 (`uptime-salary-survey-2024`, `uptime-aos-2024`)
- ⚡ Power economics from IEA WEO 2024 (`iea-weo-2024`) and live Ember feed (`ember-electricity-2025`)
- 🗺️ Latency / IX density from Telegeography + PCH (`telegeography-global-internet-map-2024`, `pch-ix-directory`)
- 🏛️ Political risk composite from EIU + WGI + V-Dem 2024 (`eiu-democracy-index-2024`, `world-bank-wgi-2024`, `vdem-2024`)
- ⚖️ Regulations — article-level cites for UAE PDPL, KSA PDPL+SDAIA, EU AI Act + GDPR, TR KVKK, ID UU PDP, TH PDPA, US VA CDPA + CA CCPA

---

## 🚢 Deploy

- ▲ **Next.js → Vercel** — `vercel.json` pre-configured
- 🚄 **FastAPI → Railway** — `railway.json` + `fastapi/Dockerfile` pre-configured
- 🐳 **Dev → Docker Compose** — both tiers side-by-side

---

## 📂 Project structure

```
DC-Control-Tower/
├── src/
│   ├── app/
│   │   ├── page.tsx                          # Hero-led crosslinq-style home
│   │   ├── api/
│   │   │   ├── agents/[...path]/route.ts     # SSE proxy to FastAPI
│   │   │   ├── data/{ember,iea,eia}/         # Live data proxies w/ snapshot fallback
│   │   │   └── health/route.ts               # Two-tier health for footer badge
│   │   └── m{1..4}-*/page.tsx
│   ├── components/
│   │   ├── brand/Logo.tsx
│   │   ├── home/{Hero,StatsBand,ModuleSection,DemoStepper,Footer}.tsx
│   │   ├── shared/HealthBadge.tsx
│   │   └── m{1..4}/
│   ├── lib/
│   │   ├── shared/{citations,rate-limit,url-state,agent-client,jurisdictions}.ts
│   │   └── m{1..4}/engines/                  # Pure-TS engines per module
│   └── data/
│       ├── citations/{CITATIONS.md,citations.json}
│       ├── snapshots/{ember-YYYY-MM,iea-weo-2024}.json
│       ├── damac-facilities.json
│       ├── candidate-sites.json
│       ├── gpu-specs.json
│       ├── regulations.json
│       └── competitors.json
├── public/brand/                             # SVG logo + isometric hero illustration
├── fastapi/
│   ├── main.py
│   ├── agents/                               # runtime + per-module routers
│   └── Dockerfile
├── scripts/gen-cite-ids.ts                   # Build-time citation validator
├── docs/                                     # ARCHITECTURE · DATA_SOURCES · DEMO_SCRIPT
├── vercel.json · railway.json · docker-compose.yml
└── LICENSE
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. This started as a portfolio / interview artefact but is evolving into a reference design for enterprise AI data-center tooling.

- ⭐ [**Star the repo**](https://github.com/Phani3108/DC-Control-Tower/stargazers) if it's useful
- 🍴 [**Fork it**](https://github.com/Phani3108/DC-Control-Tower/fork) to build your own variant
- 🐛 [**Open an issue**](https://github.com/Phani3108/DC-Control-Tower/issues/new) to report bugs or request features
- 🔧 [**Open a pull request**](https://github.com/Phani3108/DC-Control-Tower/pulls) to contribute

### Contribution guide

1. Fork the repo and create your branch: `git checkout -b feat/my-change`
2. Follow the existing patterns — engines are pure TS, UI is MUI + Framer Motion + Recharts, agents live in YAML role files, every number ships a `cite_ids[]` array
3. Adding a new number? Register the source in [`src/data/citations/citations.json`](./src/data/citations/citations.json) first
4. Make sure the build passes: `npm run build` and `npx tsc --noEmit`
5. Commit with a clear message and open a PR against `main`

---

## 📜 License

Released under the [MIT License](./LICENSE) — use, modify, redistribute freely.

---

## 👤 Author

**Phani Marupaka**
- 🐙 GitHub: [@Phani3108](https://github.com/Phani3108)
- 💼 LinkedIn: [linkedin.com/in/phani-marupaka](https://linkedin.com/in/phani-marupaka)

---

<p align="center">
  Built with ❤️ for the builders shipping the next 4,000 MW of AI-ready capacity.
</p>
