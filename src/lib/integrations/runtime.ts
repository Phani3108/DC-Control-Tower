import { promises as fs } from "node:fs";
import net from "node:net";
import nodePath from "node:path";

export const runtime = "nodejs";

export type IntegrationKind = "http" | "database";
export type IntegrationCategory = "ai" | "backend" | "data" | "connector" | "database";
export type HttpMethod = "GET" | "POST";

interface IntegrationEnvMap {
  productionUrl?: string;
  sandboxUrl?: string;
  apiKeyHeader?: string;
  apiKey?: string;
  bearerToken?: string;
  basicUsername?: string;
  basicPassword?: string;
  authHeaderName?: string;
  authHeaderValue?: string;
  dsn?: string;
  timeoutMs?: string;
}

export interface IntegrationCatalogEntry {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  kind: IntegrationKind;
  env: IntegrationEnvMap;
  defaults?: {
    productionUrl?: string;
    sandboxUrl?: string;
    timeoutMs?: number;
    testPath?: string;
    method?: HttpMethod;
    apiKeyHeader?: string;
    extraHeaders?: Record<string, string>;
  };
}

export interface StoredIntegrationConfig {
  enabled: boolean;
  useFrontendConfig: boolean;
  useSandbox: boolean;
  productionUrl?: string;
  sandboxUrl?: string;
  timeoutMs?: number;
  testPath?: string;
  method?: HttpMethod;
  apiKeyHeader?: string;
  apiKey?: string;
  bearerToken?: string;
  basicUsername?: string;
  basicPassword?: string;
  authHeaderName?: string;
  authHeaderValue?: string;
  dsn?: string;
  sandboxApiKey?: string;
  sandboxBearerToken?: string;
  sandboxBasicUsername?: string;
  sandboxBasicPassword?: string;
  sandboxAuthHeaderName?: string;
  sandboxAuthHeaderValue?: string;
  sandboxDsn?: string;
  lastTest?: IntegrationTestResult;
  lastDeepTest?: IntegrationTestResult;
}

interface IntegrationStateFile {
  version: 1;
  updatedAt: string;
  integrations: Record<string, StoredIntegrationConfig>;
}

export interface IntegrationTestResult {
  ok: boolean;
  checkedAt: string;
  durationMs: number;
  mode: "sandbox" | "production";
  target?: string;
  detail: string;
  statusCode?: number;
  diagnostics?: Record<string, string | number | boolean | null>;
}

export interface RuntimeIntegration {
  id: string;
  kind: IntegrationKind;
  category: IntegrationCategory;
  name: string;
  description: string;
  enabled: boolean;
  useSandbox: boolean;
  sourcePreference: "frontend-first" | "env-first";
  productionUrl?: string;
  sandboxUrl?: string;
  activeUrl?: string;
  timeoutMs: number;
  testPath?: string;
  method: HttpMethod;
  apiKeyHeader: string;
  extraHeaders: Record<string, string>;
  apiKey?: string;
  bearerToken?: string;
  basicUsername?: string;
  basicPassword?: string;
  authHeaderName?: string;
  authHeaderValue?: string;
  dsn?: string;
  activeDsn?: string;
  lastTest?: IntegrationTestResult;
  lastDeepTest?: IntegrationTestResult;
}

export interface IntegrationView extends Omit<RuntimeIntegration, "apiKey" | "bearerToken" | "basicPassword" | "authHeaderValue" | "dsn" | "activeDsn" | "basicUsername"> {
  hasApiKey: boolean;
  hasBearerToken: boolean;
  hasBasicAuth: boolean;
  hasCustomAuthHeader: boolean;
  hasDsn: boolean;
  secretPreview: {
    apiKey?: string;
    bearerToken?: string;
    dsn?: string;
  };
}

export interface SaveIntegrationInput {
  id: string;
  enabled?: boolean;
  useFrontendConfig?: boolean;
  useSandbox?: boolean;
  productionUrl?: string | null;
  sandboxUrl?: string | null;
  timeoutMs?: number | null;
  testPath?: string | null;
  method?: HttpMethod;
  apiKeyHeader?: string | null;
  apiKey?: string | null;
  bearerToken?: string | null;
  basicUsername?: string | null;
  basicPassword?: string | null;
  authHeaderName?: string | null;
  authHeaderValue?: string | null;
  dsn?: string | null;
  sandboxApiKey?: string | null;
  sandboxBearerToken?: string | null;
  sandboxBasicUsername?: string | null;
  sandboxBasicPassword?: string | null;
  sandboxAuthHeaderName?: string | null;
  sandboxAuthHeaderValue?: string | null;
  sandboxDsn?: string | null;
}

export const INTEGRATION_CATALOG: IntegrationCatalogEntry[] = [
  {
    id: "fastapi-agents",
    name: "FastAPI Agents Gateway",
    description: "Next.js proxy target for streaming multi-agent runs.",
    category: "backend",
    kind: "http",
    env: {
      productionUrl: "FASTAPI_URL",
      timeoutMs: "FASTAPI_TIMEOUT_MS",
    },
    defaults: {
      productionUrl: "http://localhost:8000",
      timeoutMs: 2500,
      testPath: "/v1/health",
      method: "GET",
    },
  },
  {
    id: "anthropic",
    name: "Anthropic Claude API",
    description: "Model inference and debate synthesis provider.",
    category: "ai",
    kind: "http",
    env: {
      productionUrl: "ANTHROPIC_BASE_URL",
      sandboxUrl: "ANTHROPIC_SANDBOX_URL",
      apiKey: "ANTHROPIC_API_KEY",
      timeoutMs: "ANTHROPIC_TIMEOUT_MS",
    },
    defaults: {
      productionUrl: "https://api.anthropic.com",
      timeoutMs: 3500,
      testPath: "/v1/models",
      method: "GET",
      apiKeyHeader: "x-api-key",
      extraHeaders: {
        "anthropic-version": "2023-06-01",
      },
    },
  },
  {
    id: "openai",
    name: "OpenAI API",
    description: "Optional alternate AI endpoint.",
    category: "ai",
    kind: "http",
    env: {
      productionUrl: "OPENAI_BASE_URL",
      sandboxUrl: "OPENAI_SANDBOX_URL",
      apiKey: "OPENAI_API_KEY",
      timeoutMs: "OPENAI_TIMEOUT_MS",
    },
    defaults: {
      productionUrl: "https://api.openai.com",
      timeoutMs: 3500,
      testPath: "/v1/models",
      method: "GET",
      apiKeyHeader: "authorization",
    },
  },
  {
    id: "azure-openai",
    name: "Azure OpenAI",
    description: "Azure-hosted OpenAI-compatible deployments.",
    category: "ai",
    kind: "http",
    env: {
      productionUrl: "AZURE_OPENAI_ENDPOINT",
      sandboxUrl: "AZURE_OPENAI_SANDBOX_ENDPOINT",
      apiKey: "AZURE_OPENAI_API_KEY",
      timeoutMs: "AZURE_OPENAI_TIMEOUT_MS",
    },
    defaults: {
      timeoutMs: 3500,
      testPath: "/openai/models?api-version=2024-10-21",
      method: "GET",
      apiKeyHeader: "api-key",
    },
  },
  {
    id: "eia-data",
    name: "EIA Data API",
    description: "US electricity price feed for m1/m2 assumptions.",
    category: "data",
    kind: "http",
    env: {
      productionUrl: "EIA_BASE_URL",
      apiKey: "EIA_API_KEY",
      timeoutMs: "EIA_TIMEOUT_MS",
    },
    defaults: {
      productionUrl: "https://api.eia.gov",
      timeoutMs: 3500,
      testPath: "/v2/electricity/retail-sales/data/?frequency=monthly",
      method: "GET",
      apiKeyHeader: "x-api-key",
    },
  },
  {
    id: "ember-data",
    name: "Ember Energy API",
    description: "Grid carbon and renewable share feed.",
    category: "data",
    kind: "http",
    env: {
      productionUrl: "EMBER_BASE_URL",
      apiKey: "EMBER_API_KEY",
      timeoutMs: "EMBER_TIMEOUT_MS",
    },
    defaults: {
      productionUrl: "https://api.ember-energy.org",
      timeoutMs: 3500,
      testPath: "/v1/electricity",
      method: "GET",
      apiKeyHeader: "authorization",
    },
  },
  {
    id: "m7-utility-feed",
    name: "M7 Utility Telemetry Feed",
    description: "Live utility and on-site generation telemetry source.",
    category: "connector",
    kind: "http",
    env: {
      productionUrl: "M7_UTILITY_TELEMETRY_URL",
      sandboxUrl: "M7_UTILITY_TELEMETRY_SANDBOX_URL",
      apiKeyHeader: "M7_UTILITY_TELEMETRY_API_KEY_HEADER",
      apiKey: "M7_UTILITY_TELEMETRY_API_KEY",
      bearerToken: "M7_UTILITY_TELEMETRY_BEARER_TOKEN",
      basicUsername: "M7_UTILITY_TELEMETRY_BASIC_USERNAME",
      basicPassword: "M7_UTILITY_TELEMETRY_BASIC_PASSWORD",
      authHeaderName: "M7_UTILITY_TELEMETRY_AUTH_HEADER_NAME",
      authHeaderValue: "M7_UTILITY_TELEMETRY_AUTH_HEADER_VALUE",
      timeoutMs: "M7_UTILITY_TELEMETRY_TIMEOUT_MS",
    },
    defaults: {
      timeoutMs: 2500,
      method: "GET",
      apiKeyHeader: "x-api-key",
    },
  },
  {
    id: "m7-market-feed",
    name: "M7 Market Price Feed",
    description: "Live spot and forward electricity market signal source.",
    category: "connector",
    kind: "http",
    env: {
      productionUrl: "M7_MARKET_PRICE_URL",
      sandboxUrl: "M7_MARKET_PRICE_SANDBOX_URL",
      apiKeyHeader: "M7_MARKET_PRICE_API_KEY_HEADER",
      apiKey: "M7_MARKET_PRICE_API_KEY",
      bearerToken: "M7_MARKET_PRICE_BEARER_TOKEN",
      basicUsername: "M7_MARKET_PRICE_BASIC_USERNAME",
      basicPassword: "M7_MARKET_PRICE_BASIC_PASSWORD",
      authHeaderName: "M7_MARKET_PRICE_AUTH_HEADER_NAME",
      authHeaderValue: "M7_MARKET_PRICE_AUTH_HEADER_VALUE",
      timeoutMs: "M7_MARKET_PRICE_TIMEOUT_MS",
    },
    defaults: {
      timeoutMs: 2500,
      method: "GET",
      apiKeyHeader: "x-api-key",
    },
  },
  {
    id: "postgres-primary",
    name: "PostgreSQL Primary",
    description: "Main relational database endpoint.",
    category: "database",
    kind: "database",
    env: {
      dsn: "POSTGRES_URL",
      timeoutMs: "POSTGRES_TIMEOUT_MS",
    },
    defaults: {
      timeoutMs: 2500,
    },
  },
  {
    id: "mysql-analytics",
    name: "MySQL Analytics",
    description: "Secondary analytics database endpoint.",
    category: "database",
    kind: "database",
    env: {
      dsn: "MYSQL_URL",
      timeoutMs: "MYSQL_TIMEOUT_MS",
    },
    defaults: {
      timeoutMs: 2500,
    },
  },
  {
    id: "redis-cache",
    name: "Redis Cache",
    description: "Low-latency cache/session backend.",
    category: "database",
    kind: "database",
    env: {
      dsn: "REDIS_URL",
      timeoutMs: "REDIS_TIMEOUT_MS",
    },
    defaults: {
      timeoutMs: 2000,
    },
  },
  {
    id: "mongodb-events",
    name: "MongoDB Events",
    description: "Document store for telemetry/event archives.",
    category: "database",
    kind: "database",
    env: {
      dsn: "MONGODB_URI",
      timeoutMs: "MONGODB_TIMEOUT_MS",
    },
    defaults: {
      timeoutMs: 2500,
    },
  },
];

const STATE_PATH = nodePath.join(process.cwd(), "src", "data", "integrations", "settings.local.json");

function trimToUndef(value: string | null | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  return v.length > 0 ? v : undefined;
}

function parseTimeout(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback;
}

function normalizeMethod(value: string | undefined): HttpMethod {
  return value === "POST" ? "POST" : "GET";
}

function maskSecret(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (value.length <= 6) return "*".repeat(value.length);
  return `${value.slice(0, 3)}${"*".repeat(Math.max(4, value.length - 5))}${value.slice(-2)}`;
}

function toNumberOrUndef(value: number | null | undefined): number | undefined {
  if (typeof value !== "number") return undefined;
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return Math.round(value);
}

function assignString(
  target: StoredIntegrationConfig,
  key: keyof StoredIntegrationConfig,
  value: string | null | undefined,
): void {
  if (value === undefined) return;
  if (value === null) {
    delete target[key];
    return;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    delete target[key];
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (target as any)[key] = trimmed;
}

async function readStateFile(): Promise<IntegrationStateFile> {
  try {
    const raw = await fs.readFile(STATE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<IntegrationStateFile>;
    return {
      version: 1,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date(0).toISOString(),
      integrations: typeof parsed.integrations === "object" && parsed.integrations ? parsed.integrations : {},
    };
  } catch {
    return {
      version: 1,
      updatedAt: new Date(0).toISOString(),
      integrations: {},
    };
  }
}

async function writeStateFile(next: IntegrationStateFile): Promise<void> {
  await fs.mkdir(nodePath.dirname(STATE_PATH), { recursive: true });
  await fs.writeFile(STATE_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
}

function envValue(name: string | undefined): string | undefined {
  if (!name) return undefined;
  const raw = process.env[name];
  if (!raw) return undefined;
  const v = raw.trim();
  return v.length > 0 ? v : undefined;
}

function pickByPreference(preferSaved: boolean, saved?: string, env?: string, fallback?: string): string | undefined {
  if (preferSaved) return saved ?? env ?? fallback;
  return env ?? saved ?? fallback;
}

function buildRuntime(entry: IntegrationCatalogEntry, savedRaw: StoredIntegrationConfig | undefined): RuntimeIntegration {
  const saved = savedRaw ?? {
    enabled: false,
    useFrontendConfig: false,
    useSandbox: false,
  };
  const preferSaved = saved.useFrontendConfig;

  const productionUrl = pickByPreference(
    preferSaved,
    saved.productionUrl,
    envValue(entry.env.productionUrl),
    entry.defaults?.productionUrl,
  );
  const sandboxUrl = pickByPreference(
    preferSaved,
    saved.sandboxUrl,
    envValue(entry.env.sandboxUrl),
    entry.defaults?.sandboxUrl,
  );

  const useSandbox = Boolean(saved.useSandbox);

  const timeoutMs = saved.timeoutMs
    ?? parseTimeout(envValue(entry.env.timeoutMs), entry.defaults?.timeoutMs ?? 2500);

  const apiKey = useSandbox
    ? pickByPreference(preferSaved, saved.sandboxApiKey, envValue(entry.env.apiKey))
    : pickByPreference(preferSaved, saved.apiKey, envValue(entry.env.apiKey));

  const bearerToken = useSandbox
    ? pickByPreference(preferSaved, saved.sandboxBearerToken, envValue(entry.env.bearerToken))
    : pickByPreference(preferSaved, saved.bearerToken, envValue(entry.env.bearerToken));

  const basicUsername = useSandbox
    ? pickByPreference(preferSaved, saved.sandboxBasicUsername, envValue(entry.env.basicUsername))
    : pickByPreference(preferSaved, saved.basicUsername, envValue(entry.env.basicUsername));

  const basicPassword = useSandbox
    ? pickByPreference(preferSaved, saved.sandboxBasicPassword, envValue(entry.env.basicPassword))
    : pickByPreference(preferSaved, saved.basicPassword, envValue(entry.env.basicPassword));

  const authHeaderName = useSandbox
    ? pickByPreference(preferSaved, saved.sandboxAuthHeaderName, envValue(entry.env.authHeaderName))
    : pickByPreference(preferSaved, saved.authHeaderName, envValue(entry.env.authHeaderName));

  const authHeaderValue = useSandbox
    ? pickByPreference(preferSaved, saved.sandboxAuthHeaderValue, envValue(entry.env.authHeaderValue))
    : pickByPreference(preferSaved, saved.authHeaderValue, envValue(entry.env.authHeaderValue));

  const dsn = useSandbox
    ? pickByPreference(preferSaved, saved.sandboxDsn, envValue(entry.env.dsn))
    : pickByPreference(preferSaved, saved.dsn, envValue(entry.env.dsn));

  return {
    id: entry.id,
    kind: entry.kind,
    category: entry.category,
    name: entry.name,
    description: entry.description,
    enabled: Boolean(saved.enabled),
    useSandbox,
    sourcePreference: preferSaved ? "frontend-first" : "env-first",
    productionUrl,
    sandboxUrl,
    activeUrl: useSandbox ? sandboxUrl ?? productionUrl : productionUrl,
    timeoutMs,
    testPath: saved.testPath ?? entry.defaults?.testPath,
    method: normalizeMethod(saved.method ?? entry.defaults?.method),
    apiKeyHeader: (
      saved.apiKeyHeader
      ?? envValue(entry.env.apiKeyHeader)
      ?? entry.defaults?.apiKeyHeader
      ?? "x-api-key"
    ).toLowerCase(),
    extraHeaders: entry.defaults?.extraHeaders ?? {},
    apiKey,
    bearerToken,
    basicUsername,
    basicPassword,
    authHeaderName,
    authHeaderValue,
    dsn,
    activeDsn: dsn,
    lastTest: saved.lastTest,
    lastDeepTest: saved.lastDeepTest,
  };
}

function withPath(baseUrl: string, testPath: string | undefined): string {
  if (!testPath) return baseUrl;
  if (testPath.startsWith("http://") || testPath.startsWith("https://")) return testPath;
  const normalizedPath = testPath.startsWith("/") ? testPath : `/${testPath}`;
  return `${baseUrl.replace(/\/$/, "")}${normalizedPath}`;
}

function buildHeaders(integration: RuntimeIntegration): Headers {
  const headers = new Headers();
  headers.set("Accept", "application/json");

  for (const [k, v] of Object.entries(integration.extraHeaders)) {
    headers.set(k, v);
  }

  if (integration.bearerToken) {
    headers.set(
      "Authorization",
      integration.bearerToken.toLowerCase().startsWith("bearer ")
        ? integration.bearerToken
        : `Bearer ${integration.bearerToken}`,
    );
  }

  if (integration.apiKey) {
    if (integration.apiKeyHeader === "authorization" && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${integration.apiKey}`);
    } else {
      headers.set(integration.apiKeyHeader, integration.apiKey);
    }
  }

  if (integration.basicUsername && integration.basicPassword && !headers.has("Authorization")) {
    headers.set(
      "Authorization",
      `Basic ${Buffer.from(`${integration.basicUsername}:${integration.basicPassword}`).toString("base64")}`,
    );
  }

  if (integration.authHeaderName && integration.authHeaderValue) {
    headers.set(integration.authHeaderName, integration.authHeaderValue);
  }

  return headers;
}

function parseDsnHostPort(dsn: string): { host: string; port: number } | null {
  try {
    const parsed = new URL(dsn);
    const protocol = parsed.protocol.replace(":", "").toLowerCase();

    if (protocol.endsWith("+srv")) {
      return null;
    }

    const fallbackPort =
      protocol === "postgres" || protocol === "postgresql"
        ? 5432
        : protocol === "mysql"
          ? 3306
          : protocol === "mongodb"
            ? 27017
            : protocol === "redis"
              ? 6379
              : protocol === "sqlserver" || protocol === "mssql"
                ? 1433
                : 0;

    if (!parsed.hostname) return null;

    const port = parsed.port ? Number(parsed.port) : fallbackPort;
    if (!Number.isFinite(port) || port <= 0) return null;

    return { host: parsed.hostname, port: Math.round(port) };
  } catch {
    return null;
  }
}

function probeTcp(host: string, port: number, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error(`connection timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    socket.once("connect", () => {
      clearTimeout(timeout);
      socket.end();
      resolve();
    });

    socket.once("error", (error) => {
      clearTimeout(timeout);
      socket.destroy();
      reject(error);
    });
  });
}

export async function listIntegrationViews(): Promise<IntegrationView[]> {
  const state = await readStateFile();
  return INTEGRATION_CATALOG.map((entry) => {
    const runtimeConfig = buildRuntime(entry, state.integrations[entry.id]);
    return {
      ...runtimeConfig,
      hasApiKey: Boolean(runtimeConfig.apiKey),
      hasBearerToken: Boolean(runtimeConfig.bearerToken),
      hasBasicAuth: Boolean(runtimeConfig.basicUsername || runtimeConfig.basicPassword),
      hasCustomAuthHeader: Boolean(runtimeConfig.authHeaderName && runtimeConfig.authHeaderValue),
      hasDsn: Boolean(runtimeConfig.activeDsn),
      secretPreview: {
        apiKey: maskSecret(runtimeConfig.apiKey),
        bearerToken: maskSecret(runtimeConfig.bearerToken),
        dsn: maskSecret(runtimeConfig.activeDsn),
      },
    };
  });
}

export async function getRuntimeIntegration(id: string): Promise<RuntimeIntegration | null> {
  const entry = INTEGRATION_CATALOG.find((item) => item.id === id);
  if (!entry) return null;
  const state = await readStateFile();
  return buildRuntime(entry, state.integrations[id]);
}

export async function saveIntegrations(inputs: SaveIntegrationInput[]): Promise<IntegrationView[]> {
  const state = await readStateFile();

  for (const input of inputs) {
    const entry = INTEGRATION_CATALOG.find((item) => item.id === input.id);
    if (!entry) continue;

    const current = state.integrations[input.id] ?? {
      enabled: false,
      useFrontendConfig: false,
      useSandbox: false,
    };

    if (typeof input.enabled === "boolean") current.enabled = input.enabled;
    if (typeof input.useFrontendConfig === "boolean") current.useFrontendConfig = input.useFrontendConfig;
    if (typeof input.useSandbox === "boolean") current.useSandbox = input.useSandbox;

    assignString(current, "productionUrl", input.productionUrl);
    assignString(current, "sandboxUrl", input.sandboxUrl);
    assignString(current, "testPath", input.testPath);
    assignString(current, "apiKeyHeader", input.apiKeyHeader);

    assignString(current, "apiKey", input.apiKey);
    assignString(current, "bearerToken", input.bearerToken);
    assignString(current, "basicUsername", input.basicUsername);
    assignString(current, "basicPassword", input.basicPassword);
    assignString(current, "authHeaderName", input.authHeaderName);
    assignString(current, "authHeaderValue", input.authHeaderValue);
    assignString(current, "dsn", input.dsn);

    assignString(current, "sandboxApiKey", input.sandboxApiKey);
    assignString(current, "sandboxBearerToken", input.sandboxBearerToken);
    assignString(current, "sandboxBasicUsername", input.sandboxBasicUsername);
    assignString(current, "sandboxBasicPassword", input.sandboxBasicPassword);
    assignString(current, "sandboxAuthHeaderName", input.sandboxAuthHeaderName);
    assignString(current, "sandboxAuthHeaderValue", input.sandboxAuthHeaderValue);
    assignString(current, "sandboxDsn", input.sandboxDsn);

    if (input.timeoutMs === null) {
      delete current.timeoutMs;
    } else {
      const parsedTimeout = toNumberOrUndef(input.timeoutMs);
      if (parsedTimeout) current.timeoutMs = parsedTimeout;
    }

    if (input.method) {
      current.method = normalizeMethod(input.method);
    }

    state.integrations[input.id] = current;
  }

  state.updatedAt = new Date().toISOString();
  await writeStateFile(state);
  return listIntegrationViews();
}

async function persistLastTest(id: string, result: IntegrationTestResult): Promise<void> {
  await persistLastResult(id, result, "lastTest");
}

async function persistLastDeepTest(id: string, result: IntegrationTestResult): Promise<void> {
  await persistLastResult(id, result, "lastDeepTest");
}

async function persistLastResult(
  id: string,
  result: IntegrationTestResult,
  key: "lastTest" | "lastDeepTest",
): Promise<void> {
  const state = await readStateFile();
  const current = state.integrations[id] ?? {
    enabled: false,
    useFrontendConfig: false,
    useSandbox: false,
  };
  current[key] = result;
  state.integrations[id] = current;
  state.updatedAt = new Date().toISOString();
  await writeStateFile(state);
}

function failureResult(
  start: number,
  mode: "sandbox" | "production",
  detail: string,
  target?: string,
  statusCode?: number,
  diagnostics?: Record<string, string | number | boolean | null>,
): IntegrationTestResult {
  return {
    ok: false,
    checkedAt: new Date().toISOString(),
    durationMs: Date.now() - start,
    mode,
    target,
    detail,
    statusCode,
    diagnostics,
  };
}

function successResult(
  start: number,
  mode: "sandbox" | "production",
  detail: string,
  target?: string,
  statusCode?: number,
  diagnostics?: Record<string, string | number | boolean | null>,
): IntegrationTestResult {
  return {
    ok: true,
    checkedAt: new Date().toISOString(),
    durationMs: Date.now() - start,
    mode,
    target,
    detail,
    statusCode,
    diagnostics,
  };
}

function parseModelCount(payload: unknown): number {
  if (!payload || typeof payload !== "object") return 0;
  const raw = payload as { data?: unknown; models?: unknown; value?: unknown; result?: { data?: unknown } };
  if (Array.isArray(raw.data)) return raw.data.length;
  if (Array.isArray(raw.models)) return raw.models.length;
  if (Array.isArray(raw.value)) return raw.value.length;
  if (Array.isArray(raw.result?.data)) return raw.result.data.length;
  return 0;
}

function deepModelPath(id: string): string | undefined {
  if (id === "anthropic") return "/v1/models";
  if (id === "openai") return "/v1/models";
  if (id === "azure-openai") return "/openai/models?api-version=2024-10-21";
  return undefined;
}

async function runHttpProbe(
  integration: RuntimeIntegration,
  start: number,
  targetPath?: string,
): Promise<IntegrationTestResult> {
  const mode = integration.useSandbox ? "sandbox" : "production";
  const targetBaseUrl = integration.activeUrl;
  if (!targetBaseUrl) {
    return failureResult(start, mode, "No URL configured. Add URL via frontend config or .env.");
  }

  const target = withPath(targetBaseUrl, targetPath ?? integration.testPath);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), integration.timeoutMs);
    const response = await fetch(target, {
      method: integration.method,
      headers: buildHeaders(integration),
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      return successResult(start, mode, `HTTP ${response.status} ${response.statusText || "OK"}`, target, response.status);
    }

    const detail = response.status === 401 || response.status === 403
      ? "Authentication failed (401/403). Verify credentials and auth header settings."
      : `HTTP ${response.status} ${response.statusText || "error"}`;

    return failureResult(start, mode, detail, target, response.status);
  } catch (error) {
    return failureResult(
      start,
      mode,
      error instanceof Error ? error.message : "Connection test failed.",
      target,
    );
  }
}

async function runDatabaseTcpProbe(integration: RuntimeIntegration, start: number): Promise<IntegrationTestResult> {
  const mode = integration.useSandbox ? "sandbox" : "production";
  const dsn = integration.activeDsn;
  if (!dsn) {
    return failureResult(start, mode, "No DSN configured. Add DSN via frontend config or .env.");
  }

  const hostPort = parseDsnHostPort(dsn);
  if (!hostPort) {
    return failureResult(
      start,
      mode,
      "DSN could not be parsed for TCP probe (srv protocol or malformed URL).",
      dsn,
    );
  }

  try {
    await probeTcp(hostPort.host, hostPort.port, integration.timeoutMs);
    return successResult(
      start,
      mode,
      "TCP connection established.",
      `${hostPort.host}:${hostPort.port}`,
    );
  } catch (error) {
    return failureResult(
      start,
      mode,
      error instanceof Error ? error.message : "TCP probe failed.",
      `${hostPort.host}:${hostPort.port}`,
    );
  }
}

async function runDeepAiProbe(integration: RuntimeIntegration, start: number): Promise<IntegrationTestResult> {
  const mode = integration.useSandbox ? "sandbox" : "production";
  const targetBaseUrl = integration.activeUrl;
  if (!targetBaseUrl) {
    return failureResult(start, mode, "No URL configured. Add URL via frontend config or .env.");
  }

  const path = deepModelPath(integration.id) ?? integration.testPath;
  const target = withPath(targetBaseUrl, path);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), integration.timeoutMs);
    const response = await fetch(target, {
      method: "GET",
      headers: buildHeaders(integration),
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const detail = response.status === 401 || response.status === 403
        ? "Authentication failed (401/403). Verify credentials and auth header settings."
        : `HTTP ${response.status} ${response.statusText || "error"}`;
      return failureResult(start, mode, detail, target, response.status);
    }

    const payload = (await response.json().catch(() => null)) as unknown;
    const modelCount = parseModelCount(payload);
    if (modelCount <= 0) {
      return failureResult(
        start,
        mode,
        "Endpoint reachable but model list payload is empty or unrecognized.",
        target,
        response.status,
        {
          provider: integration.id,
          modelCount,
        },
      );
    }

    return successResult(
      start,
      mode,
      `${integration.name}: model list check succeeded (${modelCount} models).`,
      target,
      response.status,
      {
        provider: integration.id,
        modelCount,
      },
    );
  } catch (error) {
    return failureResult(
      start,
      mode,
      error instanceof Error ? error.message : "AI deep test failed.",
      target,
    );
  }
}

async function runDeepPostgresProbe(integration: RuntimeIntegration, start: number): Promise<IntegrationTestResult> {
  const mode = integration.useSandbox ? "sandbox" : "production";
  const dsn = integration.activeDsn;
  if (!dsn) return failureResult(start, mode, "No DSN configured. Add DSN via frontend config or .env.");

  let client: { end: () => Promise<void> } | null = null;
  try {
    const url = new URL(dsn);
    const { Client } = await import("pg");
    const sslMode = url.searchParams.get("sslmode")?.toLowerCase();
    const requiresSsl = sslMode === "require" || sslMode === "verify-full" || sslMode === "verify-ca";
    const pgClient = new Client({
      connectionString: dsn,
      connectionTimeoutMillis: integration.timeoutMs,
      query_timeout: integration.timeoutMs,
      statement_timeout: integration.timeoutMs,
      ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
    });
    client = pgClient;

    await pgClient.connect();
    const result = await pgClient.query<{ db?: string }>("SELECT current_database() AS db");
    const db = result.rows[0]?.db;
    const port = Number(url.port || "5432");
    return successResult(
      start,
      mode,
      `PostgreSQL login + query check succeeded${db ? ` (db=${db})` : ""}.`,
      `${url.hostname}:${port}`,
      undefined,
      {
        provider: "postgres",
        host: url.hostname,
        port,
        database: db ?? null,
        sslMode: sslMode ?? "none",
      },
    );
  } catch (error) {
    return failureResult(start, mode, error instanceof Error ? error.message : "PostgreSQL deep test failed.", dsn);
  } finally {
    if (client) {
      await client.end().catch(() => undefined);
    }
  }
}

async function runDeepMysqlProbe(integration: RuntimeIntegration, start: number): Promise<IntegrationTestResult> {
  const mode = integration.useSandbox ? "sandbox" : "production";
  const dsn = integration.activeDsn;
  if (!dsn) return failureResult(start, mode, "No DSN configured. Add DSN via frontend config or .env.");

  let conn: { query: (sql: string) => Promise<[unknown, unknown]>; end: () => Promise<void> } | null = null;
  try {
    const url = new URL(dsn);
    const mysql = await import("mysql2/promise");
    conn = await mysql.createConnection(dsn);

    const [rows] = await conn.query("SELECT DATABASE() AS db");

    let db: string | undefined;
    if (Array.isArray(rows) && rows.length > 0 && rows[0] && typeof rows[0] === "object") {
      const maybeDb = (rows[0] as Record<string, unknown>).db;
      db = typeof maybeDb === "string" ? maybeDb : undefined;
    }

    const port = Number(url.port || "3306");

    return successResult(
      start,
      mode,
      `MySQL login + query check succeeded${db ? ` (db=${db})` : ""}.`,
      `${url.hostname}:${port}`,
      undefined,
      {
        provider: "mysql",
        host: url.hostname,
        port,
        database: db ?? null,
      },
    );
  } catch (error) {
    return failureResult(start, mode, error instanceof Error ? error.message : "MySQL deep test failed.", dsn);
  } finally {
    if (conn) {
      await conn.end().catch(() => undefined);
    }
  }
}

async function runDeepRedisProbe(integration: RuntimeIntegration, start: number): Promise<IntegrationTestResult> {
  const mode = integration.useSandbox ? "sandbox" : "production";
  const dsn = integration.activeDsn;
  if (!dsn) return failureResult(start, mode, "No DSN configured. Add DSN via frontend config or .env.");

  let cleanupClient: {
    isOpen?: boolean;
    quit: () => Promise<unknown>;
    disconnect: () => void;
  } | null = null;
  try {
    const url = new URL(dsn);
    const redis = await import("redis");
    const redisClient = redis.createClient({
      url: dsn,
      socket: {
        connectTimeout: integration.timeoutMs,
      },
    });
    cleanupClient = redisClient;

    await redisClient.connect();
    const pong = await redisClient.ping();
    let redisVersion: string | undefined;
    try {
      const infoRaw = await (
        redisClient as { sendCommand: (args: string[]) => Promise<unknown> }
      ).sendCommand(["INFO", "server"]);
      const infoText = typeof infoRaw === "string" ? infoRaw : "";
      const match = infoText.match(/redis_version:([^\r\n]+)/);
      redisVersion = match?.[1]?.trim();
    } catch {
      redisVersion = undefined;
    }

    const selectedDb = (() => {
      const rawPath = url.pathname.replace(/^\//, "");
      if (!rawPath) return 0;
      const parsed = Number(rawPath);
      return Number.isFinite(parsed) ? parsed : 0;
    })();

    const port = Number(url.port || "6379");
    if (pong.toUpperCase() !== "PONG") {
      return failureResult(
        start,
        mode,
        `Redis deep test received unexpected ping response: ${pong}`,
        `${url.hostname}:${port}`,
        undefined,
        {
          provider: "redis",
          host: url.hostname,
          port,
          selectedDb,
          ping: pong,
          redisVersion: redisVersion ?? null,
        },
      );
    }

    return successResult(
      start,
      mode,
      `Redis deep test succeeded (PING -> ${pong})${redisVersion ? ` · v${redisVersion}` : ""}.`,
      `${url.hostname}:${port}`,
      undefined,
      {
        provider: "redis",
        host: url.hostname,
        port,
        selectedDb,
        ping: pong,
        redisVersion: redisVersion ?? null,
      },
    );
  } catch (error) {
    return failureResult(start, mode, error instanceof Error ? error.message : "Redis deep test failed.", dsn);
  } finally {
    if (cleanupClient?.isOpen) {
      await cleanupClient.quit().catch(() => {
        cleanupClient?.disconnect();
      });
    }
  }
}

async function runDeepMongoProbe(integration: RuntimeIntegration, start: number): Promise<IntegrationTestResult> {
  const mode = integration.useSandbox ? "sandbox" : "production";
  const dsn = integration.activeDsn;
  if (!dsn) return failureResult(start, mode, "No DSN configured. Add DSN via frontend config or .env.");

  let client: { close: () => Promise<void> } | null = null;
  try {
    const url = new URL(dsn);
    const { MongoClient } = await import("mongodb");
    const mongoClient = new MongoClient(dsn, {
      serverSelectionTimeoutMS: integration.timeoutMs,
      connectTimeoutMS: integration.timeoutMs,
      socketTimeoutMS: integration.timeoutMs,
    });
    client = mongoClient;

    await mongoClient.connect();
    const pingResult = await mongoClient.db("admin").admin().ping();
    const buildInfoRaw = await mongoClient.db("admin").command({ buildInfo: 1 });
    const buildInfo = buildInfoRaw as { version?: unknown };
    const ok = typeof pingResult.ok === "number" ? pingResult.ok === 1 : true;
    if (!ok) {
      return failureResult(
        start,
        mode,
        `Mongo deep test returned unexpected ping payload: ${JSON.stringify(pingResult)}`,
        url.hostname,
        undefined,
        {
          provider: "mongodb",
          ok: false,
          pingOk: typeof pingResult.ok === "number" ? pingResult.ok : null,
        },
      );
    }

    const targetHost = url.protocol.includes("+srv")
      ? `${url.hostname} (srv)`
      : `${url.hostname}:${url.port || "27017"}`;
    const defaultDb = url.pathname.replace(/^\//, "") || "admin";
    const authSource = url.searchParams.get("authSource") ?? "default";
    return successResult(
      start,
      mode,
      `MongoDB deep test succeeded (db.admin().ping())${buildInfo.version ? ` · v${buildInfo.version}` : ""}.`,
      targetHost,
      undefined,
      {
        provider: "mongodb",
        database: defaultDb,
        authSource,
        serverVersion: typeof buildInfo.version === "string" ? buildInfo.version : null,
        srv: url.protocol.includes("+srv"),
      },
    );
  } catch (error) {
    return failureResult(start, mode, error instanceof Error ? error.message : "Mongo deep test failed.", dsn);
  } finally {
    if (client) {
      await client.close().catch(() => undefined);
    }
  }
}

async function runStandardProbe(integration: RuntimeIntegration, start: number): Promise<IntegrationTestResult> {
  if (integration.kind === "database") {
    return runDatabaseTcpProbe(integration, start);
  }
  return runHttpProbe(integration, start);
}

export async function testIntegration(id: string): Promise<IntegrationTestResult> {
  const integration = await getRuntimeIntegration(id);
  if (!integration) {
    return {
      ok: false,
      checkedAt: new Date().toISOString(),
      durationMs: 0,
      mode: "production",
      detail: `Unknown integration '${id}'.`,
    };
  }

  const start = Date.now();
  const mode = integration.useSandbox ? "sandbox" : "production";

  if (!integration.enabled) {
    const result = failureResult(start, mode, "Integration is disabled. Enable it before testing.");
    await persistLastTest(id, result);
    return result;
  }

  const result = await runStandardProbe(integration, start);
  await persistLastTest(id, result);
  return result;
}

export async function deepTestIntegration(id: string): Promise<IntegrationTestResult> {
  const integration = await getRuntimeIntegration(id);
  if (!integration) {
    return {
      ok: false,
      checkedAt: new Date().toISOString(),
      durationMs: 0,
      mode: "production",
      detail: `Unknown integration '${id}'.`,
    };
  }

  const start = Date.now();
  const mode = integration.useSandbox ? "sandbox" : "production";

  if (!integration.enabled) {
    const result = failureResult(start, mode, "Integration is disabled. Enable it before deep test.");
    await persistLastDeepTest(id, result);
    return result;
  }

  let result: IntegrationTestResult;
  if (integration.id === "anthropic" || integration.id === "openai" || integration.id === "azure-openai") {
    result = await runDeepAiProbe(integration, start);
  } else if (integration.id === "postgres-primary") {
    result = await runDeepPostgresProbe(integration, start);
  } else if (integration.id === "mysql-analytics") {
    result = await runDeepMysqlProbe(integration, start);
  } else if (integration.id === "redis-cache") {
    result = await runDeepRedisProbe(integration, start);
  } else if (integration.id === "mongodb-events") {
    result = await runDeepMongoProbe(integration, start);
  } else {
    const fallback = await runStandardProbe(integration, start);
    result = {
      ...fallback,
      detail: `No provider-specific deep check for ${integration.name}; fallback probe result: ${fallback.detail}`,
    };
  }

  await persistLastDeepTest(id, result);
  return result;
}

export async function testAllIntegrations(): Promise<Array<{ id: string; result: IntegrationTestResult }>> {
  const views = await listIntegrationViews();
  const results: Array<{ id: string; result: IntegrationTestResult }> = [];

  for (const view of views) {
    if (!view.enabled) continue;
    results.push({ id: view.id, result: await testIntegration(view.id) });
  }

  return results;
}

export async function deepTestAllIntegrations(): Promise<Array<{ id: string; result: IntegrationTestResult }>> {
  const views = await listIntegrationViews();
  const results: Array<{ id: string; result: IntegrationTestResult }> = [];

  for (const view of views) {
    if (!view.enabled) continue;
    results.push({ id: view.id, result: await deepTestIntegration(view.id) });
  }

  return results;
}

export async function runSandboxSmoke(): Promise<{
  ok: boolean;
  executedAt: string;
  checks: Array<{ id: string; ok: boolean; detail: string }>;
}> {
  const views = await listIntegrationViews();
  const checks: Array<{ id: string; ok: boolean; detail: string }> = [];

  for (const view of views) {
    if (!view.enabled || !view.useSandbox) continue;
    const result = await testIntegration(view.id);
    checks.push({ id: view.id, ok: result.ok, detail: result.detail });
  }

  const ok = checks.every((item) => item.ok);
  return {
    ok,
    executedAt: new Date().toISOString(),
    checks,
  };
}

export function getIntegrationCatalog(): IntegrationCatalogEntry[] {
  return INTEGRATION_CATALOG;
}

export function readIntegrationValue(runtime: RuntimeIntegration, field: "url" | "dsn" | "apiKey" | "bearerToken"): string | undefined {
  if (field === "url") return runtime.activeUrl;
  if (field === "dsn") return runtime.activeDsn;
  if (field === "apiKey") return runtime.apiKey;
  return runtime.bearerToken;
}

export function normalizeAuthHeaderName(value: string | undefined, fallback: string): string {
  const normalized = trimToUndef(value);
  return normalized ?? fallback;
}
