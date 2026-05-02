# Developer Guide

## Purpose

This guide explains how to run, configure, test, and extend DC Control Tower with the new Integration Center.

## Runtime Topology

- Next.js (App Router) owns deterministic engines, UI, API proxy routes, connector adaptors, and integration control plane.
- FastAPI owns AI multi-agent orchestration and SSE streaming.
- Integration settings can be supplied from:
  - Frontend-managed server-side store (saved via `/integrations`)
  - Backend environment variables (`.env`, `.env.local`, deployment secret store)

Resolution behavior:
- If `useFrontendConfig=true`, runtime uses saved values first and falls back to `.env`.
- If `useFrontendConfig=false`, runtime uses `.env` first and falls back to saved values.

## Local Setup

1. Install JS dependencies

```bash
npm install --legacy-peer-deps
```

2. Install Python dependencies

```bash
cd fastapi
pip install -e .
cd ..
```

3. Configure backend environment

```bash
cp .env.example .env.local
# set at minimum:
# - ANTHROPIC_API_KEY
# - FASTAPI_URL
```

4. Start both tiers

```bash
npm run dev
cd fastapi && uvicorn main:app --reload
```

5. Open Integration Center

- URL: `/integrations`
- Configure AI, DB, connector, and data APIs.
- Save values, run tests, run deep tests, and validate sandbox mode.

## Integration Center Operations

### Save settings

- Toggle `Enabled` for active services.
- Toggle `Frontend config priority` to choose resolution precedence.
- Set `Use sandbox` to switch active URL/key/DSN to sandbox variants.
- Click `Save settings`.

### Test connections

- `Test connection` on a single integration card.
- `Test all enabled` for a full sweep.
- `Deep test` on a single integration card for provider-specific checks.
- `Deep test all enabled` for one-click provider-specific checks across enabled integrations.
- `Run sandbox smoke` for all enabled integrations with `useSandbox=true`.

### Error visibility

- Each card stores and displays `lastTest` with:
  - pass/fail
  - detail message
  - target
  - latency
  - mode (`production` or `sandbox`)
- Deep-check outcomes are stored and displayed as `lastDeepTest`.

## Phase-2 deep tests

- AI providers (`anthropic`, `openai`, `azure-openai`): authenticated model-list endpoint validation with parsed model count checks.
- Databases:
  - `postgres-primary`: actual login + query check.
  - `mysql-analytics`: actual login + query check.
  - `redis-cache`: actual `PING` check expecting `PONG`.
  - `mongodb-events`: actual `db.admin().ping()` check.
- Other providers currently use standard probe fallback until provider-specific deep checks are added.

## Phase-2.2 diagnostics

- Deep tests now emit a structured `diagnostics` object for frontend visibility and API consumers.
- Diagnostics are safe metadata only and do not include secrets.
- The Integration Center surfaces these details inline with deep test results.

## Current Integration Inventory

- Backend:
  - `fastapi-agents`
- AI:
  - `anthropic`
  - `openai`
  - `azure-openai`
- Data APIs:
  - `eia-data`
  - `ember-data`
- External connectors:
  - `m7-utility-feed`
  - `m7-market-feed`
- Databases:
  - `postgres-primary`
  - `mysql-analytics`
  - `redis-cache`
  - `mongodb-events`

## Security Notes

- Secrets are never returned from APIs in plain text.
- UI receives masked previews only.
- Store file is local-only and should remain gitignored.
- Production deployments should still prefer managed secret stores and `.env`/platform vars.

## Extending Integrations

1. Add a catalog entry in `src/lib/integrations/runtime.ts`.
2. Define env mappings and default test behavior.
3. Save from `/integrations` and verify with `/api/integrations/test`.
4. Wire runtime resolution into consuming route/adapter.
5. Update `docs/API_DOCS.md` and `/api-docs` page.

## Troubleshooting

- Agents down:
  - validate `fastapi-agents` URL
  - test `/v1/health`
- M7 feeds mock only:
  - configure both M7 feed integrations and re-test
- EIA/Ember snapshot fallback:
  - set API keys and test feed endpoints
- DB test fails:
  - check host/port reachability and DSN format
