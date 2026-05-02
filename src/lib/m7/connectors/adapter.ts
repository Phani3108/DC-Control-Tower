import type { M7IngestionEnvelope, MarketPriceSignal, UtilityTelemetrySignal } from "./contract";

interface UtilityPayload {
  utilityFeedMW?: number;
  utility_mw?: number;
  onsiteGenerationMW?: number;
  onsite_mw?: number;
  reserveConstraintMW?: number;
  reserve_mw?: number;
  source?: string;
  observedAt?: string;
  timestamp?: string;
}

interface MarketPayload {
  spotPriceUSDPerMWh?: number;
  spot_usd_mwh?: number;
  forwardPriceUSDPerMWh?: number;
  forward_usd_mwh?: number;
  marketRegion?: string;
  market?: string;
  source?: string;
  observedAt?: string;
  timestamp?: string;
}

type ProviderEnvPrefix = "M7_UTILITY_TELEMETRY" | "M7_MARKET_PRICE";

function nowIso(): string {
  return new Date().toISOString();
}

function readEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  const value = raw.trim();
  return value.length > 0 ? value : undefined;
}

function readTimeoutMs(prefix: ProviderEnvPrefix): number {
  const fromProvider = readEnv(`${prefix}_TIMEOUT_MS`);
  const fromGlobal = readEnv("M7_CONNECTOR_TIMEOUT_MS");
  const raw = fromProvider ?? fromGlobal;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 2500;
}

function buildAuthHeaders(prefix: ProviderEnvPrefix): HeadersInit {
  const headers: Record<string, string> = { Accept: "application/json" };

  const bearerToken = readEnv(`${prefix}_BEARER_TOKEN`);
  if (bearerToken) {
    headers.Authorization = bearerToken.toLowerCase().startsWith("bearer ")
      ? bearerToken
      : `Bearer ${bearerToken}`;
  }

  const apiKey = readEnv(`${prefix}_API_KEY`);
  if (apiKey) {
    const apiKeyHeader = readEnv(`${prefix}_API_KEY_HEADER`) ?? "x-api-key";
    headers[apiKeyHeader] = apiKey;
  }

  const basicUser = readEnv(`${prefix}_BASIC_USERNAME`);
  const basicPass = readEnv(`${prefix}_BASIC_PASSWORD`);
  if (basicUser && basicPass && !headers.Authorization) {
    headers.Authorization = `Basic ${Buffer.from(`${basicUser}:${basicPass}`).toString("base64")}`;
  }

  const customHeaderName = readEnv(`${prefix}_AUTH_HEADER_NAME`);
  const customHeaderValue = readEnv(`${prefix}_AUTH_HEADER_VALUE`);
  if (customHeaderName && customHeaderValue) {
    headers[customHeaderName] = customHeaderValue;
  }

  return headers;
}

async function fetchJson(url: string, prefix: ProviderEnvPrefix): Promise<unknown> {
  const timeoutMs = readTimeoutMs(prefix);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: buildAuthHeaders(prefix),
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`fetch failed (${res.status})`);
    return (await res.json()) as unknown;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeUtility(payload: unknown): UtilityTelemetrySignal | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as UtilityPayload;

  const utilityFeedMW = p.utilityFeedMW ?? p.utility_mw;
  const onsiteGenerationMW = p.onsiteGenerationMW ?? p.onsite_mw;

  if (typeof utilityFeedMW !== "number" || typeof onsiteGenerationMW !== "number") return null;

  return {
    state: "live",
    source: p.source ?? "utility-api",
    observedAt: p.observedAt ?? p.timestamp ?? nowIso(),
    utilityFeedMW,
    onsiteGenerationMW,
    reserveConstraintMW: typeof p.reserveConstraintMW === "number" ? p.reserveConstraintMW : p.reserve_mw,
  };
}

function normalizeMarket(payload: unknown): MarketPriceSignal | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as MarketPayload;

  const spotPriceUSDPerMWh = p.spotPriceUSDPerMWh ?? p.spot_usd_mwh;
  if (typeof spotPriceUSDPerMWh !== "number") return null;

  const forward = p.forwardPriceUSDPerMWh ?? p.forward_usd_mwh;

  return {
    state: "live",
    source: p.source ?? "market-api",
    observedAt: p.observedAt ?? p.timestamp ?? nowIso(),
    spotPriceUSDPerMWh,
    forwardPriceUSDPerMWh: typeof forward === "number" ? forward : undefined,
    marketRegion: p.marketRegion ?? p.market,
  };
}

function mockUtility(): UtilityTelemetrySignal {
  return {
    state: "mock",
    source: "mock-utility-signal",
    observedAt: nowIso(),
    utilityFeedMW: 84,
    onsiteGenerationMW: 17,
    reserveConstraintMW: 8,
  };
}

function mockMarket(): MarketPriceSignal {
  return {
    state: "mock",
    source: "mock-market-signal",
    observedAt: nowIso(),
    spotPriceUSDPerMWh: 118,
    forwardPriceUSDPerMWh: 112,
    marketRegion: "UAE-North",
  };
}

export async function ingestM7Signals(): Promise<M7IngestionEnvelope> {
  const utilityUrl = process.env.M7_UTILITY_TELEMETRY_URL;
  const marketUrl = process.env.M7_MARKET_PRICE_URL;

  const utilityPromise = utilityUrl
    ? fetchJson(utilityUrl, "M7_UTILITY_TELEMETRY").then(normalizeUtility).catch(() => null)
    : Promise.resolve(null);
  const marketPromise = marketUrl
    ? fetchJson(marketUrl, "M7_MARKET_PRICE").then(normalizeMarket).catch(() => null)
    : Promise.resolve(null);

  const [utilityRaw, marketRaw] = await Promise.all([utilityPromise, marketPromise]);

  const utility = utilityRaw ?? mockUtility();
  const market = marketRaw ?? mockMarket();

  return {
    utility,
    market,
    recommendedInputPatch: {
      utilityFeedMW: utility.utilityFeedMW,
      onsiteGenerationMW: utility.onsiteGenerationMW,
      spotPriceUSDPerMWh: market.spotPriceUSDPerMWh,
    },
  };
}
