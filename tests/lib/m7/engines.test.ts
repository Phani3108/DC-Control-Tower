import { describe, expect, it } from "vitest";
import { runM7 } from "../../../src/lib/m7/engines";
import type { M7Input } from "../../../src/lib/m7/types";

const BASE_INPUT: M7Input = {
  facilityId: "dxb-1",
  facilityName: "Dubai AI Campus · Block A",
  geography: "UAE",
  targetITMW: 72,
  pue: 1.27,
  utilityFeedMW: 86,
  onsiteGenerationMW: 18,
  batteryMWh: 56,
  spotPriceUSDPerMWh: 122,
  demandResponsePct: 11,
  contractMode: "hybrid-ppa-spot",
  reservePolicy: "N-1",
};

describe("runM7", () => {
  it("produces coherent power-balance outputs", () => {
    const out = runM7(BASE_INPUT);

    expect(out.dispatchPlan.length).toBe(3);
    expect(out.gridRisks.length).toBeGreaterThan(0);
    expect(out.firmAvailableMW).toBeGreaterThan(0);
    expect(out.blendedPowerCostUSDPerMWh).toBeGreaterThan(0);
    expect(out.annualPowerCostUSDm).toBeGreaterThan(0);
  });

  it("shows higher annual cost under merchant contract mode", () => {
    const hedged = runM7({ ...BASE_INPUT, contractMode: "firm-ppa", spotPriceUSDPerMWh: 110 });
    const merchant = runM7({ ...BASE_INPUT, contractMode: "merchant", spotPriceUSDPerMWh: 150 });

    expect(merchant.blendedPowerCostUSDPerMWh).toBeGreaterThan(hedged.blendedPowerCostUSDPerMWh);
    expect(merchant.annualPowerCostUSDm).toBeGreaterThan(hedged.annualPowerCostUSDm);
  });
});
