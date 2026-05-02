import { describe, expect, it } from "vitest";
import { ingestM7Signals } from "@/lib/m7/connectors/adapter";

describe("M7 connectors", () => {
  it("falls back to mock signals when no live endpoints are configured", async () => {
    const prevUtility = process.env.M7_UTILITY_TELEMETRY_URL;
    const prevMarket = process.env.M7_MARKET_PRICE_URL;
    delete process.env.M7_UTILITY_TELEMETRY_URL;
    delete process.env.M7_MARKET_PRICE_URL;

    try {
      const out = await ingestM7Signals();
      expect(out.utility.state).toBe("mock");
      expect(out.market.state).toBe("mock");
      expect(out.recommendedInputPatch.utilityFeedMW).toBeGreaterThan(0);
      expect(out.recommendedInputPatch.spotPriceUSDPerMWh).toBeGreaterThan(0);
    } finally {
      if (typeof prevUtility === "string") process.env.M7_UTILITY_TELEMETRY_URL = prevUtility;
      else delete process.env.M7_UTILITY_TELEMETRY_URL;

      if (typeof prevMarket === "string") process.env.M7_MARKET_PRICE_URL = prevMarket;
      else delete process.env.M7_MARKET_PRICE_URL;
    }
  });

  it("applies configured auth headers for utility provider calls", async () => {
    const prevUtilityUrl = process.env.M7_UTILITY_TELEMETRY_URL;
    const prevBearer = process.env.M7_UTILITY_TELEMETRY_BEARER_TOKEN;
    const prevApiKey = process.env.M7_UTILITY_TELEMETRY_API_KEY;
    const prevApiKeyHeader = process.env.M7_UTILITY_TELEMETRY_API_KEY_HEADER;
    const prevHeaderName = process.env.M7_UTILITY_TELEMETRY_AUTH_HEADER_NAME;
    const prevHeaderValue = process.env.M7_UTILITY_TELEMETRY_AUTH_HEADER_VALUE;

    process.env.M7_UTILITY_TELEMETRY_URL = "https://utility.example/signals";
    process.env.M7_UTILITY_TELEMETRY_BEARER_TOKEN = "token-123";
    process.env.M7_UTILITY_TELEMETRY_API_KEY = "key-456";
    process.env.M7_UTILITY_TELEMETRY_API_KEY_HEADER = "x-utility-key";
    process.env.M7_UTILITY_TELEMETRY_AUTH_HEADER_NAME = "x-provider-env";
    process.env.M7_UTILITY_TELEMETRY_AUTH_HEADER_VALUE = "prod";

    const originalFetch = global.fetch;
    let capturedHeaders: HeadersInit | undefined;

    global.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
      capturedHeaders = init?.headers;
      return {
        ok: true,
        json: async () => ({ utilityFeedMW: 91, onsiteGenerationMW: 21 }),
      } as Response;
    }) as typeof fetch;

    try {
      const out = await ingestM7Signals();
      expect(out.utility.state).toBe("live");
      expect(out.utility.utilityFeedMW).toBe(91);

      const headers = new Headers(capturedHeaders);
      expect(headers.get("authorization")).toBe("Bearer token-123");
      expect(headers.get("x-utility-key")).toBe("key-456");
      expect(headers.get("x-provider-env")).toBe("prod");
    } finally {
      global.fetch = originalFetch;

      if (typeof prevUtilityUrl === "string") process.env.M7_UTILITY_TELEMETRY_URL = prevUtilityUrl;
      else delete process.env.M7_UTILITY_TELEMETRY_URL;

      if (typeof prevBearer === "string") process.env.M7_UTILITY_TELEMETRY_BEARER_TOKEN = prevBearer;
      else delete process.env.M7_UTILITY_TELEMETRY_BEARER_TOKEN;

      if (typeof prevApiKey === "string") process.env.M7_UTILITY_TELEMETRY_API_KEY = prevApiKey;
      else delete process.env.M7_UTILITY_TELEMETRY_API_KEY;

      if (typeof prevApiKeyHeader === "string") process.env.M7_UTILITY_TELEMETRY_API_KEY_HEADER = prevApiKeyHeader;
      else delete process.env.M7_UTILITY_TELEMETRY_API_KEY_HEADER;

      if (typeof prevHeaderName === "string") process.env.M7_UTILITY_TELEMETRY_AUTH_HEADER_NAME = prevHeaderName;
      else delete process.env.M7_UTILITY_TELEMETRY_AUTH_HEADER_NAME;

      if (typeof prevHeaderValue === "string") process.env.M7_UTILITY_TELEMETRY_AUTH_HEADER_VALUE = prevHeaderValue;
      else delete process.env.M7_UTILITY_TELEMETRY_AUTH_HEADER_VALUE;
    }
  });
});
