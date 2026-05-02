# Deployment Guide

The DC Control Tower ships as two tiers that deploy independently:

| Tier | Platform | Config | Responsibility |
|---|---|---|---|
| Web | **Vercel** | `vercel.json` | Next.js UI, pure-TS engines, SSE proxy, data proxies |
| Agents | **Railway** | `railway.json` + `fastapi/Dockerfile` | FastAPI + Anthropic Claude |

The web tier can run **without** the agents tier — set `MOCK_AGENTS=true` and all four modules remain functional using canned SSE streams.

---

## 1 · Deploy Next.js to Vercel

### Initial import

1. In the Vercel dashboard → **Add New → Project → Import** `Phani3108/DC-Control-Tower`
2. Framework preset: **Next.js** (auto-detected)
3. Root directory: leave as `./`
4. Build & Output settings: leave as default (the committed `vercel.json` already sets `installCommand` to `npm install --legacy-peer-deps`)
5. Click **Deploy** — it will fail on first import if env vars are missing, that's fine, fix in step 2

### Required environment variables

Set these in **Vercel Project Settings → Environment Variables**. Scope them to Production + Preview + Development unless noted.

| Name | Value | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-…` | Only if you expose the key to Next.js proxying — usually leave blank here and put it on Railway only |
| `FASTAPI_URL` | `https://<your-railway-app>.up.railway.app` | Your Railway FastAPI URL. Leave blank + set `MOCK_AGENTS=true` if you haven't deployed Railway yet. |
| `NEXT_PUBLIC_APP_URL` | `https://<your-vercel-app>.vercel.app` | Used for CORS checks. Update once Vercel assigns the URL. |
| `MOCK_AGENTS` | `true` or `false` | `true` short-circuits the agent proxy to canned SSE streams — useful for standalone Vercel deploys. |
| `EMBER_API_KEY` | *(optional)* | If unset, `/api/data/ember` serves the committed monthly snapshot. |
| `EIA_API_KEY` | *(optional)* | If unset, `/api/data/eia` serves the US snapshot. |
| `M7_UTILITY_TELEMETRY_URL` | `https://<utility-provider>/...` | Optional live utility telemetry feed used by `GET /api/connectors/m7/power-signals`. |
| `M7_MARKET_PRICE_URL` | `https://<market-provider>/...` | Optional live market price feed used by `GET /api/connectors/m7/power-signals`. |
| `M7_CONNECTOR_TIMEOUT_MS` | `2500` | Optional global timeout for connector HTTP calls (ms). |
| `M7_UTILITY_TELEMETRY_BEARER_TOKEN` | *(optional)* | Utility provider bearer token. |
| `M7_UTILITY_TELEMETRY_API_KEY` | *(optional)* | Utility provider API key. |
| `M7_UTILITY_TELEMETRY_API_KEY_HEADER` | `x-api-key` | Header name used with utility API key. |
| `M7_UTILITY_TELEMETRY_BASIC_USERNAME` | *(optional)* | Utility provider basic auth username. |
| `M7_UTILITY_TELEMETRY_BASIC_PASSWORD` | *(optional)* | Utility provider basic auth password. |
| `M7_UTILITY_TELEMETRY_AUTH_HEADER_NAME` | *(optional)* | Utility custom auth header name. |
| `M7_UTILITY_TELEMETRY_AUTH_HEADER_VALUE` | *(optional)* | Utility custom auth header value. |
| `M7_MARKET_PRICE_BEARER_TOKEN` | *(optional)* | Market provider bearer token. |
| `M7_MARKET_PRICE_API_KEY` | *(optional)* | Market provider API key. |
| `M7_MARKET_PRICE_API_KEY_HEADER` | `x-api-key` | Header name used with market API key. |
| `M7_MARKET_PRICE_BASIC_USERNAME` | *(optional)* | Market provider basic auth username. |
| `M7_MARKET_PRICE_BASIC_PASSWORD` | *(optional)* | Market provider basic auth password. |
| `M7_MARKET_PRICE_AUTH_HEADER_NAME` | *(optional)* | Market custom auth header name. |
| `M7_MARKET_PRICE_AUTH_HEADER_VALUE` | *(optional)* | Market custom auth header value. |
| `ANTHROPIC_OPUS_MODEL` | `claude-opus-4-6` | Override to pin a specific model version. |
| `ANTHROPIC_SONNET_MODEL` | `claude-sonnet-4-6` | Override to pin a specific model version. |

### Minimum config for a working Vercel-only preview

If you only want to show off the UI without provisioning Railway:

```
MOCK_AGENTS=true
NEXT_PUBLIC_APP_URL=https://<your-vercel-app>.vercel.app
```

That's it — all four module SSE debates will render canned responses and the home page will be fully navigable.

### Why we don't use Vercel Secrets (`@name` syntax)

The old `env: { "FASTAPI_URL": "@fastapi_url" }` block in `vercel.json` referenced "Vercel Secrets," which had to be pre-created with `vercel secrets add` before deploy. Vercel deprecated this workflow in 2022 in favour of project-scoped Environment Variables set via the dashboard. The current `vercel.json` omits the `env` block entirely — configure variables in the dashboard.

---

## 2 · Deploy FastAPI to Railway

### Initial import

1. Railway dashboard → **New Project → Deploy from GitHub repo** → `Phani3108/DC-Control-Tower`
2. Railway reads `railway.json` and `fastapi/Dockerfile` automatically
3. Set the service's **Root Directory** to `fastapi/`
4. Set the **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Expose port `$PORT` (Railway provides it)

### Required environment variables

| Name | Value | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-…` | **Required.** Never commit this. |
| `ANTHROPIC_OPUS_MODEL` | `claude-opus-4-6` | Optional override. |
| `ANTHROPIC_SONNET_MODEL` | `claude-sonnet-4-6` | Optional override. |
| `NEXT_PUBLIC_APP_URL` | `https://<your-vercel-app>.vercel.app` | CORS allow-list. Required — otherwise the Next.js proxy will be blocked. |
| `CACHE_DIR` | `/data/agent-cache` | Disk cache for deterministic preset replays. Attach a Railway Volume if you want persistence between deploys. |

### Verify

After deploy, visit `https://<your-railway-app>.up.railway.app/v1/health` — should return:

```json
{ "status": "ok", "service": "dc-control-tower", "version": "0.1.0" }
```

Copy the Railway URL back into `FASTAPI_URL` on Vercel, then redeploy the web tier.

---

## 3 · Wire the two tiers together

1. Deploy Railway first, grab its URL.
2. Paste URL into Vercel's `FASTAPI_URL` env var, set `MOCK_AGENTS=false`.
3. Redeploy Vercel (it auto-rebuilds on env-var change if you tick that box).
4. Visit your Vercel URL `/api/health` — should return `{ web: { status: "ok" }, agents: { status: "ok" } }`.
5. The footer HealthBadge on the home page should show two green dots.

---

## 4 · Local development

```bash
# terminal A — Next.js (port 3000)
npm run dev

# terminal B — FastAPI (port 8000)
cd fastapi && uvicorn main:app --reload
```

Or one-command via Docker:

```bash
docker compose up
```

---

## 5 · Troubleshooting

**"Environment Variable 'FASTAPI_URL' references Secret 'fastapi_url', which does not exist"**
→ Old `vercel.json` used the legacy `@secret` syntax. The current committed `vercel.json` no longer does. Pull latest, redeploy.

**Health badge shows `agents: down`**
→ Either `FASTAPI_URL` is wrong, or Railway is cold-starting (≤30s first byte). Refresh after a moment.

**Anthropic rate limiting mid-demo**
→ Set `MOCK_AGENTS=true` on Vercel and redeploy; canned SSE streams replace live calls.

**`npm install` fails with peer-dep error**
→ Ensure `installCommand` in `vercel.json` is `npm install --legacy-peer-deps` (it is, as of commit `3ca60e3`). `react-simple-maps@3` hasn't updated its peer dep for React 19 yet.

**Next.js build fails on `next.config.ts`**
→ Requires Next.js 15+. If your Vercel project pins an older Node, bump to Node 20 in Project Settings.
