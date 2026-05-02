# API Docs

## Integration Control Plane APIs

### GET `/api/integrations/config`
Returns catalog metadata and masked effective integration settings.

Response shape:

```json
{
  "ok": true,
  "generatedAt": "2026-05-02T00:00:00.000Z",
  "integrations": [
    {
      "id": "anthropic",
      "kind": "http",
      "category": "ai",
      "enabled": true,
      "useSandbox": false,
      "sourcePreference": "frontend-first",
      "productionUrl": "https://api.anthropic.com",
      "activeUrl": "https://api.anthropic.com",
      "timeoutMs": 3500,
      "testPath": "/v1/models",
      "apiKeyHeader": "x-api-key",
      "hasApiKey": true,
      "secretPreview": {
        "apiKey": "sk-**********ab"
      },
      "lastTest": {
        "ok": true,
        "detail": "HTTP 200 OK",
        "durationMs": 243,
        "mode": "production"
      }
    }
  ],
  "catalog": []
}
```

### POST `/api/integrations/config`
Saves integration settings.

Request shape:

```json
{
  "integrations": [
    {
      "id": "postgres-primary",
      "enabled": true,
      "useFrontendConfig": true,
      "useSandbox": false,
      "dsn": "postgres://user:pass@host:5432/db",
      "timeoutMs": 2500
    }
  ]
}
```

Notes:
- Omitted secret fields are unchanged.
- `null` secret values clear stored values.
- Runtime fallback to `.env` is always available.

### POST `/api/integrations/test`
Runs connection tests.

Single integration:

```json
{ "id": "ember-data" }
```

All enabled integrations:

```json
{ "all": true }
```

Response:

```json
{
  "ok": true,
  "testedAt": "2026-05-02T00:00:00.000Z",
  "results": [
    {
      "id": "ember-data",
      "result": {
        "ok": false,
        "checkedAt": "2026-05-02T00:00:00.000Z",
        "durationMs": 511,
        "mode": "production",
        "target": "https://api.ember-energy.org/v1/electricity",
        "detail": "Authentication failed (401/403). Verify credentials and auth header settings.",
        "statusCode": 401
      }
    }
  ]
}
```

### POST `/api/integrations/test-run`
Runs sandbox smoke checks for enabled integrations with `useSandbox=true`.

Response:

```json
{
  "ok": false,
  "message": "Sandbox smoke tests found failures. Check checks[].detail for errors.",
  "executedAt": "2026-05-02T00:00:00.000Z",
  "checks": [
    {
      "id": "m7-utility-feed",
      "ok": false,
      "detail": "connection timeout after 2500ms"
    }
  ]
}
```

## Existing Product APIs (selected)

### GET `/api/health`
- Reports web and FastAPI status.
- FastAPI URL is resolved via integration runtime + `.env` fallback.

### `/api/agents/[...path]` (GET/POST)
- Proxies requests to FastAPI.
- Supports mock/cache replay fallback.
- Uses resolved `fastapi-agents` runtime URL.

### GET `/api/connectors/m7/power-signals`
- Ingests utility + market signals.
- Uses resolved runtime config for:
  - `m7-utility-feed`
  - `m7-market-feed`

### GET `/api/data/eia`
- Uses resolved runtime API key/base URL.
- Snapshot fallback if key missing or upstream fails.

### GET `/api/data/ember`
- Uses resolved runtime API key/base URL.
- Snapshot fallback if key missing or upstream fails.

## Error Contract Principles

- Errors return JSON with `ok: false` and a useful message.
- Integration tests persist `lastTest` so failures are visible in frontend cards.
- Database tests are TCP-level reachability probes (host:port), not SQL login checks.

### POST `/api/integrations/deep-test`
Runs provider-specific deep checks.

Single integration:

```json
{ "id": "postgres-primary" }
```

All enabled integrations:

```json
{ "all": true }
```

Deep-check behavior:

- `anthropic`, `openai`, `azure-openai`: authenticated model-list fetch + payload validation.
- `postgres-primary`: real DB login + query (`SELECT current_database()`).
- `mysql-analytics`: real DB login + query (`SELECT DATABASE()`).
- `redis-cache`: real Redis command check (`PING` expecting `PONG`).
- `mongodb-events`: real Mongo command check (`db.admin().ping()`).
- other integrations: fallback to standard connectivity probe with explicit note.

Deep test results are persisted as `lastDeepTest` for frontend visibility.

`IntegrationTestResult` may include `diagnostics` with provider-specific safe metadata, for example:

- AI: provider id + parsed model count
- PostgreSQL/MySQL: host/port/db
- Redis: host/port/selectedDb/ping/server version
- MongoDB: db/authSource/server version/srv indicator
