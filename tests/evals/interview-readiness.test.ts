import { describe, expect, it } from "vitest";
import { getPreset } from "../../src/data/presets";
import type { M1Input } from "../../src/lib/m1/types";
import type { M2Input } from "../../src/lib/m2/types";
import type { M3Input } from "../../src/lib/m3/types";
import type { M4Input } from "../../src/lib/m4/types";
import type { M5Input } from "../../src/lib/m5/types";
import type { M6Input } from "../../src/lib/m6/types";
import type { M7Input } from "../../src/lib/m7/types";
import type { M8Input } from "../../src/lib/m8/types";
import { runAllEngines } from "../../src/lib/m1/engines";
import { runM2 } from "../../src/lib/m2/engines";
import { runM3 } from "../../src/lib/m3/engines";
import { runM4 } from "../../src/lib/m4/engines";
import { runM5 } from "../../src/lib/m5/engines";
import { runM6 } from "../../src/lib/m6/engines";
import { runM7 } from "../../src/lib/m7/engines";
import { runM8 } from "../../src/lib/m8/engines";

function requirePreset<TInput>(id: string): TInput {
  const preset = getPreset(id);
  if (!preset) throw new Error(`Missing preset: ${id}`);
  return preset.input as TInput;
}

describe("Interview Readiness Eval Scaffold", () => {
  it("M1 preset produces ranked sites", () => {
    const input = requirePreset<M1Input>("m1-sea-500mw");
    const out = runAllEngines(input);
    expect(out.scorecards.length).toBeGreaterThan(1);
    expect(out.topSite).toBeTruthy();
    expect(out.scorecards[0].overallScore).toBeGreaterThanOrEqual(out.scorecards[1].overallScore);
  });

  it("M2 preset produces facility fit and comparisons", () => {
    const input = requirePreset<M2Input>("m2-anthropic-b200-40mw");
    const out = runM2(input);
    expect(out.fits.length).toBeGreaterThan(0);
    expect(out.primaryFacilityId).toBeTruthy();
    expect(out.comparisons.length).toBeGreaterThan(0);
  });

  it("M3 preset produces anomalies and failure risks", () => {
    const input = requirePreset<M3Input>("m3-zoneb-latency-0417");
    const out = runM3(input);
    expect(out.series.points.length).toBeGreaterThan(20);
    expect(out.anomalies.length).toBeGreaterThan(0);
    expect(Array.isArray(out.failureRisks)).toBe(true);
  });

  it("M4 preset produces a non-empty routing plan", () => {
    const input = requirePreset<M4Input>("m4-ksa-fintech-eu-data");
    const out = runM4(input);
    expect(out.assessments.length).toBeGreaterThan(0);
    expect(out.routing.length).toBeGreaterThan(0);
    expect(out.primaryFacility).toBeTruthy();
  });

  it("M5 preset produces critical path and spread", () => {
    const input = requirePreset<M5Input>("m5-jakarta-19mw-phase1");
    const out = runM5(input);
    expect(out.milestones.find((m) => m.id === "energization")).toBeDefined();
    expect(out.p90EnergizationDate >= out.p50EnergizationDate).toBe(true);
    expect(out.scheduleSpreadDays).toBeGreaterThanOrEqual(0);
  });

  it("M6 preset produces cooling setpoint and savings outputs", () => {
    const input = requirePreset<M6Input>("m6-riyadh-64mw-cooling");
    const out = runM6(input);
    expect(out.setpointPlan.length).toBeGreaterThan(0);
    expect(out.hotspotRisks.length).toBeGreaterThan(0);
    expect(out.optimizedPUEP90 >= out.optimizedPUEP50).toBe(true);
    expect(out.coolingEnergySavingsPct).toBeGreaterThan(0);
  });

  it("M7 preset produces dispatch and grid-risk outputs", () => {
    const input = requirePreset<M7Input>("m7-dubai-72mw-power");
    const out = runM7(input);
    expect(out.dispatchPlan.length).toBeGreaterThan(0);
    expect(out.gridRisks.length).toBeGreaterThan(0);
    expect(out.annualPowerCostUSDm).toBeGreaterThan(0);
  });

  it("M8 preset produces tenant-fit and revenue outputs", () => {
    const input = requirePreset<M8Input>("m8-abu-dhabi-35mw-tenants");
    const out = runM8(input);
    expect(out.tenantFits.length).toBeGreaterThan(0);
    expect(out.revenueScenarios.length).toBe(3);
    expect(out.totalProjectedRevenueUSDm).toBeGreaterThan(0);
    expect(out.paybackMonthsP90).toBeGreaterThanOrEqual(out.paybackMonthsP50);
  });
});
