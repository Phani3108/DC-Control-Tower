import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";

const ORIGINAL_FETCH = globalThis.fetch;

async function readSSE(res: Response): Promise<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let chunks = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks += decoder.decode(value);
  }
  return chunks;
}

describe("agent proxy cache replay", () => {
  beforeAll(() => {
    process.env.MOCK_AGENTS = "true";
    // Force fetch to fail so the offline path is exercised even if MOCK is removed.
    globalThis.fetch = vi.fn(async () => {
      throw new Error("forced offline");
    }) as unknown as typeof fetch;
  });

  afterAll(() => {
    delete process.env.MOCK_AGENTS;
    globalThis.fetch = ORIGINAL_FETCH;
  });

  it("replays cache fixture when preset_id matches", async () => {
    const cacheDir = path.join(process.cwd(), "src", "data", "agent-cache");
    const files = await fs.readdir(cacheDir);
    const m1 = files.find((f) => f.startsWith("m1-sea-500mw-"));
    expect(m1).toBeDefined();

    const { POST } = await import("@/app/api/agents/[...path]/route");
    const req = new Request("http://localhost/api/agents/site-debate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ preset_id: "m1-sea-500mw" }),
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0], {
      params: Promise.resolve({ path: ["site-debate"] }),
    });
    expect(res.headers.get("X-Mock-Source")).toBe("cache-replay");
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");
    const body = await readSSE(res);
    expect(body).toContain("event: phase");
    expect(body).toContain("event: done");
    expect(body).toContain("power_analyst");
  });

  it("returns generic stub when preset_id absent", async () => {
    const { POST } = await import("@/app/api/agents/[...path]/route");
    const req = new Request("http://localhost/api/agents/site-debate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0], {
      params: Promise.resolve({ path: ["site-debate"] }),
    });
    expect(res.headers.get("X-Mock-Source")).toBe("generic-stub");
    const body = await readSSE(res);
    expect(body).toContain("Mock agent");
  });

  it("returns workload stub for rfp-extract", async () => {
    const { POST } = await import("@/app/api/agents/[...path]/route");
    const req = new Request("http://localhost/api/agents/rfp-extract", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rfpText: "x" }),
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0], {
      params: Promise.resolve({ path: ["rfp-extract"] }),
    });
    expect(res.headers.get("X-Mock-Source")).toBe("rfp-extract-stub");
    const json = (await res.json()) as { workload: { gpu: string; clusterMW: number } };
    expect(json.workload.gpu).toBe("B200");
    expect(json.workload.clusterMW).toBe(40);
  });
});
