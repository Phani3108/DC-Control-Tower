import { describe, expect, it } from "vitest";
import { runM8 } from "../../../src/lib/m8/engines";
import type { M8Input } from "../../../src/lib/m8/types";

const BASE_INPUT: M8Input = {
  facilityId: "auh-1",
  facilityName: "Abu Dhabi AI Campus · Zone 2",
  geography: "UAE",
  availableMW: 48,
  committedMW: 13,
  targetGpu: "B200",
  pue: 1.24,
  pricingMode: "hybrid",
  contractTermYears: 5,
  renewablePremiumPct: 7,
  financingCostPct: 9.5,
  targetGrossMarginPct: 38,
};

describe("runM8", () => {
  it("produces coherent tenant and revenue outputs", () => {
    const out = runM8(BASE_INPUT);

    expect(out.tenantFits.length).toBe(4);
    expect(out.revenueScenarios.length).toBe(3);
    expect(out.sellableMW).toBeGreaterThan(0);
    expect(out.totalProjectedRevenueUSDm).toBeGreaterThan(0);
    expect(out.paybackMonthsP90).toBeGreaterThanOrEqual(out.paybackMonthsP50);
  });

  it("shows stronger margin with longer contract terms", () => {
    const shortTerm = runM8({ ...BASE_INPUT, contractTermYears: 2 });
    const longTerm = runM8({ ...BASE_INPUT, contractTermYears: 8 });

    expect(longTerm.weightedGrossMarginPct).toBeGreaterThanOrEqual(shortTerm.weightedGrossMarginPct);
  });
});
