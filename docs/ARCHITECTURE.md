# DC Control Tower — Architecture

## 1 · Split of concerns

```
┌───────────────────────────────────────────────────────────────┐
│  Browser (Next.js 16 / MUI 7 / Recharts / react-simple-maps)  │
│  Forms, charts, maps, exports, URL-encoded scenario state     │
└────────────────────────────┬──────────────────────────────────┘
                             │
            /api/agents/… (SSE-capable proxy)
                             │
        /api/data/{ember,iea,eia}/… (CORS proxy, optional)
                             │
┌────────────────────────────▼──────────────────────────────────┐
│  Next.js server (Vercel · Node runtime)                       │
│  - Pure-TS engines (power, cost, cooling, SLA, regulation)    │
│  - Static data reads (facilities, GPUs, regulations)          │
│  - Proxies outbound calls; Anthropic key never here           │
└────────────────────────────┬──────────────────────────────────┘
                             │
                  FASTAPI_URL (private)
                             │
┌────────────────────────────▼──────────────────────────────────┐
│  FastAPI (Railway · Python 3.12)                              │
│  - Multi-agent runtime: Agent · debate · extract              │
│  - Claude Opus 4.6 (synthesis) · Sonnet 4.6 (extraction)      │
│  - Disk cache keyed by preset hash — replayable demos         │
│  - RFP PDF/text parsing                                        │
└────────────────────────────────────────────────────────────────┘
```

**Principle**: Next.js owns everything deterministic. FastAPI owns everything that calls Claude.

---

## 2 · FastAPI surface (v1)

| Endpoint | Phase | Stream | Purpose |
|---|---|---|---|
| `POST /v1/agents/site-debate` | P1 | SSE | M1 — debate across PowerAnalyst / SovereigntyAnalyst / FinanceAnalyst / ClimateAnalyst → ICSynthesizer |
| `POST /v1/agents/compliance-reason` | P2 | SSE | M4 — per-jurisdiction JurisdictionAnalysts → ComplianceSynthesizer (cite_id only) |
| `POST /v1/agents/rfp-extract` | P3 | One-shot JSON | M2 — RFPExtractor (Sonnet, structured output) |
| `POST /v1/agents/proposal-draft` | P3 | SSE | M2 — ProposalWriter (Opus) using facility fit results |
| `POST /v1/agents/rca` | P4 | SSE | M3 — OpsAgent / InfraAgent / RiskAgent debate → RCASynthesizer |
| `POST /v1/agents/nl-query` | P4 | SSE | M3 — Opus with telemetry JSON tool access |
| `GET /v1/health` | P0 | — | Railway healthcheck |

## 3 · Multi-agent pattern

Single shared runtime (`fastapi/agents/runtime.py`) exposes three primitives reused across all modules:

1. **`Agent`** — a named persona. `model` alias (`"opus"` or `"sonnet"`) is resolved from env at runtime so we can swap model versions without touching role code.
2. **`debate(agents, question, synthesizer, rounds)`** — round-robin debate with shared transcript. Each agent sees prior turns. The synthesizer (always Opus) renders final decision + confidence + dissents + key_drivers as JSON.
3. **`extract(agent, schema, input)`** — one-shot structured JSON output validated against a Pydantic model. Used for RFP extraction, telemetry triage, regulation lookup.

### Routing policy

- **Sonnet 4.6** — bulk + structured: per-region regulation reasoning, RFP extraction, anomaly triage, per-agent debate turns.
- **Opus 4.6** — synthesis only: IC memo, proposal narrative, compliance brief, RCA synthesis, NL ops queries. One Opus call per flow.

This keeps unit cost bounded and predictable while giving the most important output (final decision) the strongest reasoning.

### Per-module casts

| Module | Opening agents (Sonnet) | Synthesizer (Opus) |
|---|---|---|
| M1 | PowerAnalyst, SovereigntyAnalyst, FinanceAnalyst, ClimateAnalyst | ICSynthesizer |
| M2 | RFPExtractor, FitEvaluator | ProposalWriter |
| M3 | OpsAgent, InfraAgent, RiskAgent | RCASynthesizer / NLQueryAgent (Opus) |
| M4 | JurisdictionAnalyst × N (one per relevant region) | ComplianceSynthesizer (cite_id-only refs) |

Role prompts live in `fastapi/agents/roles/*.yaml` so non-code edits don't need a release.

---

## 4 · Shared code (do not fork)

- `src/lib/shared/jurisdictions/index.ts` — canonical `Jurisdiction` type. Used by M1 ("can we build here?") and M4 ("can this workload run here?"). Same object, two altitudes.
- `src/lib/shared/types.ts` — `DAMACFacility`, `CandidateSite`, `GPUSpec`, `WorkloadProfile`, `AgentTurn`, `DebateResult`, `DemoPreset`.
- `src/lib/shared/url-state.ts` — base64-URL encoding of scenario JSON. Every scenario is a shareable link.
- `src/lib/shared/agent-client.ts` — async-iterable SSE reader. All modules consume it.
- `src/data/damac-facilities.json` — single source of truth for facility inventory across home map, M1 comparators, M2 fit evaluator, M4 routing recommender.

---

## 5 · Demo reliability

- **URL-encoded scenarios** — every demo is `?preset=<id>`; no live typing during the interview.
- **Disk cache** — first successful run writes `src/data/agent-cache/<preset-hash>.json`; subsequent runs replay deterministically.
- **MOCK_AGENTS flag** — short-circuits the Next.js proxy to canned SSE fixtures. Use for offline dev or if Anthropic has an outage during the demo.
- **Anthropic keep-alive** — a Railway cron pings `/v1/health` every 10 minutes to avoid cold-start surprise during the interview.

---

## 6 · Deploy

| Tier | Platform | Build | Env |
|---|---|---|---|
| Next.js | Vercel | `next build` | `FASTAPI_URL`, `NEXT_PUBLIC_APP_URL`, `MOCK_AGENTS` |
| FastAPI | Railway | `fastapi/Dockerfile` | `ANTHROPIC_API_KEY`, `ANTHROPIC_OPUS_MODEL`, `ANTHROPIC_SONNET_MODEL`, `NEXT_PUBLIC_APP_URL` |

Local dev uses `docker-compose.yml` to run both tiers side-by-side.
