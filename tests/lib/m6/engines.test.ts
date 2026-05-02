import { describe, expect, it } from "vitest";
import { runM6 } from "../../../src/lib/m6/engines";
import type { M6Input } from "../../../src/lib/m6/types";

const BASE_INPUT: M6Input = {
  facilityId: "riyadh-1",
  facilityName: "Riyadh AI Campus · Pod C",
  geography: "Saudi Arabia",
  targetITMW: 64,
  ambientTempC: 38,
  humidityPct: 42,
  coolingMode: "hybrid-dlc",
  redundancyTier: "2N",
  rackDensityKW: 96,
  pueTarget: 1.26,
};

describe("runM6", () => {
  it("produces coherent cooling optimization outputs", () => {
    const out = runM6(BASE_INPUT);

    expect(out.setpointPlan.length).toBe(3);
    expect(out.hotspotRisks.length).toBeGreaterThan(0);
    expect(out.optimizedPUEP50).toBeLessThan(out.currentPUE);
    expect(out.optimizedPUEP90).toBeGreaterThanOrEqual(out.optimizedPUEP50);
    expect(out.coolingEnergySavingsPct).toBeGreaterThan(0);
    expect(out.annualSavingsUSDm).toBeGreaterThan(0);
  });

  it("shows worse baseline PUE at higher ambient temperatures", () => {
    const coolAmbient = runM6({ ...BASE_INPUT, ambientTempC: 30 });
    const hotAmbient = runM6({ ...BASE_INPUT, ambientTempC: 42 });

    expect(hotAmbient.currentPUE).toBeGreaterThan(coolAmbient.currentPUE);
    expect(hotAmbient.optimizedPUEP50).toBeGreaterThanOrEqual(coolAmbient.optimizedPUEP50);
  });
});
