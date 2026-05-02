import type { M7IngestionEnvelope, MarketPriceSignal, UtilityTelemetrySignal } from "./contract";
import { getRuntimeIntegration, type RuntimeIntegration } from "@/lib/integrations/runtime";

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

function readTimeoutMs(integration: RuntimeIntegration | null, prefix: ProviderEnvPrefix): number {
  const fromProvider = readEnv(`${prefix}_TIMEOUT_MS`);
  const fromGlobal = readEnv("M7_CONNECTOR_TIMEOUT_MS");
  const fromEnv = fromProvider ?? fromGlobal;
  const parsed = fromEnv ? Number(fromEnv) : NaN;
  const envTimeout = Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : undefined;
  return integration?.timeoutMs ?? envTimeout ?? 2500;
}

function buildAuthHeaders(integration: RuntimeIntegration | null, prefix: ProviderEnvPrefix): HeadersInit {
  const headers: Record<string, string> = { Accept: "application/json" };

  const bearerToken = integration?.bearerToken ?? readEnv(`${prefix}_BEARER_TOKEN`);
  if (bearerToken) {
    headers.Authorization = bearerToken.toLowerCase().startsWith("bearer ")
      ? bearerToken
      : `Bearer ${bearerToken}`;
  }

  const apiKey = integration?.apiKey ?? readEnv(`${prefix}_API_KEY`);
  if (apiKey) {
    const apiKeyHeader = integration?.apiKeyHeader ?? readEnv(`${prefix}_API_KEY_HEADER`) ?? "x-api-key";
    headers[apiKeyHeader] = apiKey;
  }

  const basicUser = integration?.basicUsername ?? readEnv(`${prefix}_BASIC_USERNAME`);
  const basicPass = integration?.basicPassword ?? readEnv(`${prefix}_BASIC_PASSWORD`);
  if (basicUser && basicPass && !headers.Authorization) {
    headers.Authorization = `Basic ${Buffer.from(`${basicUser}:${basicPass}`).toString("base64")}`;
  }

  const customHeaderName = integration?.authHeaderName ?? readEnv(`${prefix}_AUTH_HEADER_NAME`);
  const customHeaderValue = integration?.authHeaderValue ?? readEnv(`${prefix}_AUTH_HEADER_VALUE`);
  if (customHeaderName && customHeaderValue) {
    headers[customHeaderName] = customHeaderValue;
  }

  return headers;
}

async function fetchJson(url: string, integration: RuntimeIntegration | null, prefix: ProviderEnvPrefix): Promise<unknown> {
  const timeoutMs = readTimeoutMs(integration, prefix);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: buildAuthHeaders(integration, prefix),
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
  const [utilityIntegration, marketIntegration] = await Promise.all([
    getRuntimeIntegration("m7-utility-feed"),
    getRuntimeIntegration("m7-market-feed"),
  ]);

  const utilityUrl = utilityIntegration?.activeUrl ?? process.env.M7_UTILITY_TELEMETRY_URL;
  const marketUrl = marketIntegration?.activeUrl ?? process.env.M7_MARKET_PRICE_URL;

  const utilityPromise = utilityUrl
    ? fetchJson(utilityUrl, utilityIntegration, "M7_UTILITY_TELEMETRY").then(normalizeUtility).catch(() => null)
    : Promise.resolve(null);
  const marketPromise = marketUrl
    ? fetchJson(marketUrl, marketIntegration, "M7_MARKET_PRICE").then(normalizeMarket).catch(() => null)
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
