# 🗼 DC Control Tower

> A unified AI command center for an AI-ready data-center business — covering **strategy**, **sales**, **operations**, and **compliance** in one place.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![Claude](https://img.shields.io/badge/Claude-Opus_4.6_%2B_Sonnet_4.6-8E44AD?logo=anthropic&logoColor=white)
![Build](https://img.shields.io/badge/Build-passing-22C55E)

---

## 🎯 What it does

- 🧭 **Decides where to build** — scores candidate sites across power, cost, sovereignty, climate, and 6 more dimensions
- 🤝 **Matches workloads to facilities** — turn any RFP into a fit ranking + cost + SLA + proposal in under a minute
- 🖥️ **Runs the ops floor** — live telemetry + multi-agent root-cause analysis + natural-language incident queries
- ⚖️ **Keeps workloads legal** — routes requests across 9 jurisdictions with cited compliance rules, never hallucinated URLs
- 🌍 **All on one map** — a unified home with every facility, every open proposal, every open incident

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
npm run dev                                        # terminal A → http://localhost:3000
cd fastapi && uvicorn main:app --reload            # terminal B → http://localhost:8000
```

- 💡 Offline / unreliable network? Set `MOCK_AGENTS=true` in `.env.local` — streams canned responses instead of calling Claude.
- 🐳 One-command dev via Docker: `docker compose up`

---

## 🎬 Try the demos

Every demo is a URL — no typing required.

- 🧭 [SEA 500 MW deployment](http://localhost:3000/m1-site-intelligence?preset=m1-sea-500mw) — board-level site selection
- 🤝 [40 MW B200 RFP](http://localhost:3000/m2-capacity-matcher?preset=m2-anthropic-b200-40mw) — RFP → proposal in seconds
- 🖥️ [Zone B latency spike](http://localhost:3000/m3-ops-tower?preset=m3-zoneb-latency-0417) — incident RCA + what-if simulations
- ⚖️ [Saudi fintech + EU data](http://localhost:3000/m4-sovereignty?preset=m4-ksa-fintech-eu-data) — compliance routing with citations

Full 10-minute script: [`docs/DEMO_SCRIPT.md`](./docs/DEMO_SCRIPT.md)

---

## 🏗️ How it's built

### Stack

- ⚛️ **Next.js 16** (App Router) + **React 19** + **MUI 7** + **Recharts** + **react-simple-maps**
- 🐍 **FastAPI** + **Pydantic** + **sse-starlette** for multi-agent orchestration
- 🧠 **Anthropic Claude** — **Opus 4.6** for synthesis, **Sonnet 4.6** for extraction / debate turns
- 🔒 **TypeScript strict** + **Zod** schemas end-to-end
- 📐 Pure-TS engines (deterministic, unit-testable) + SSE-streamed agent reasoning

### Architecture

```
┌─────────────────── Browser ───────────────────┐
│   Next.js 16 + MUI 7 + Recharts + world map   │
└──────────────────────┬────────────────────────┘
                       │  /api/agents/*  (SSE)
┌──────────────────────▼────────────────────────┐
│   Next.js server (Vercel · Node runtime)      │
│   Pure-TS engines · static data · SSE proxy   │
└──────────────────────┬────────────────────────┘
                       │  FASTAPI_URL (private)
┌──────────────────────▼────────────────────────┐
│   FastAPI (Railway · Python 3.12)             │
│   Agent runtime · Claude Opus + Sonnet        │
└───────────────────────────────────────────────┘
```

- 🔀 Everything deterministic lives in Next.js (engines, scoring, charts)
- 🧠 Everything that calls Claude lives in FastAPI (debates, extractions, synthesis)
- 💾 Preset responses are disk-cached by hash so demos replay byte-identical
- 🔐 Your Anthropic key never leaves the server; clients never see the Python URL

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the full wiring.

---

## 🤖 The agents

- 🧭 **M1** — PowerAnalyst + SovereigntyAnalyst + FinanceAnalyst + ClimateAnalyst → IC Synthesizer
- 🤝 **M2** — RFPExtractor (structured JSON) → ProposalWriter (narrative)
- 🖥️ **M3** — OpsAgent + InfraAgent + RiskAgent → RCA Synthesizer + NLQueryAgent
- ⚖️ **M4** — Per-jurisdiction Analysts → Compliance Synthesizer (cite_id-only — never invents URLs)

All role prompts live in [`fastapi/agents/roles/*.yaml`](./fastapi/agents/roles/) — editable without a code release.

---

## 📚 Data sources

Every number in this product is grounded in public data.

- 📄 [`docs/DATA_SOURCES.md`](./docs/DATA_SOURCES.md) — full citation ledger
- 🏢 DAMAC facilities hand-curated from press releases
- 🔌 GPU specs from NVIDIA / AMD datasheets
- 🌱 Ember · IEA · EIA for energy mix + pricing
- 🌋 USGS · GEM for seismic hazard
- ⚖️ Public regulator sources (UAE PDPL, Saudi SDAIA, EU AI Act, etc.)

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
│   ├── app/              # Next.js routes + SSE proxy
│   ├── components/       # per-module UI (m1/ m2/ m3/ m4/ home/)
│   ├── lib/              # pure-TS engines + shared types
│   └── data/             # facilities, GPUs, regulations, presets, cache
├── fastapi/
│   ├── main.py
│   ├── agents/           # runtime + per-module agent routers
│   └── Dockerfile
├── docs/                 # ARCHITECTURE · DATA_SOURCES · DEMO_SCRIPT
├── vercel.json · railway.json · docker-compose.yml
└── LICENSE
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. This is a portfolio / interview artefact but PRs with improvements are appreciated.

- ⭐ [**Star the repo**](https://github.com/Phani3108/DC-Control-Tower/stargazers) if it's useful
- 🍴 [**Fork it**](https://github.com/Phani3108/DC-Control-Tower/fork) to build your own variant
- 🐛 [**Open an issue**](https://github.com/Phani3108/DC-Control-Tower/issues/new) to report bugs or request features
- 🔧 [**Open a pull request**](https://github.com/Phani3108/DC-Control-Tower/pulls) to contribute

### Contribution guide

1. Fork the repo and create your branch: `git checkout -b feat/my-change`
2. Follow the existing patterns — engines are pure TS, UI is MUI + Recharts, agents live in YAML role files
3. Make sure the build passes: `npm run build` and `npx tsc --noEmit`
4. Commit with a clear message and open a PR against `main`

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
