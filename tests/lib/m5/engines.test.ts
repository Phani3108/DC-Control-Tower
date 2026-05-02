import { describe, expect, it } from "vitest";
import { runM5 } from "../../../src/lib/m5/engines";
import type { M5Input } from "../../../src/lib/m5/types";

const BASE_INPUT: M5Input = {
  projectId: "PRJ-JKT-19MW-P1",
  projectName: "Jakarta AI Campus · Phase 1",
  geography: "Indonesia",
  targetMW: 19.2,
  plannedNoticeToProceed: "2026-06-15",
  permitComplexity: 3,
  utilityQueueMonths: 8,
  longLeadTightness: 4,
  epcReadiness: 3,
  contingencyPct: 12,
};

describe("runM5", () => {
  it("produces a coherent timeline and risk model", () => {
    const result = runM5(BASE_INPUT);

    expect(result.milestones.length).toBeGreaterThan(0);
    expect(result.risks.length).toBeGreaterThan(0);
    expect(result.p90EnergizationDate >= result.p50EnergizationDate).toBe(true);
    expect(result.scheduleSpreadDays).toBeGreaterThanOrEqual(0);
    expect(result.capexAtRiskUSDm).toBeGreaterThan(0);

    const energized = result.milestones.find((m) => m.id === "energization");
    expect(energized).toBeDefined();
    if (!energized) throw new Error("energization milestone missing");
    expect(energized.p90Finish >= energized.p50Finish).toBe(true);
  });

  it("shows later commissioning when permit complexity increases", () => {
    const lowPermit = runM5({ ...BASE_INPUT, permitComplexity: 1 });
    const highPermit = runM5({ ...BASE_INPUT, permitComplexity: 5 });

    expect(highPermit.p50EnergizationDate >= lowPermit.p50EnergizationDate).toBe(true);
    expect(highPermit.p90EnergizationDate >= lowPermit.p90EnergizationDate).toBe(true);
  });
});
