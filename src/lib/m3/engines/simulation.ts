import type { SimulationInput, SimulationOutput, TelemetrySeries } from "../types";

/**
 * What-if simulator. Takes the current series baseline and projects a
 * scenario forward. Heuristic numbers — good enough to demo "what happens
 * if load rises 30%?" type questions.
 */
export function runSimulation(
  series: TelemetrySeries,
  input: SimulationInput,
): SimulationOutput {
  const latest = series.points[series.points.length - 1];
  const baseLatency = latest.latencyP99Ms;
  const baseOutlet = latest.outletTempC;

  switch (input.scenario) {
    case "load-plus-30":
      return {
        scenario: input.scenario,
        projectedPeakLatencyMs: round(baseLatency * 1.28, 1),
        projectedPeakTempC: round(baseOutlet + 5.4, 1),
        tripRiskComponents: ["PDU-4", "CRAC-3", "Row-12 thermal margin"],
        mitigations: [
          "Pre-commit DLC loop failover sequence",
          "Shed low-priority inference workloads (~8 MW)",
          "Pre-warm spare GPU racks in Zone-A for overflow",
        ],
      };
    case "cooling-drop":
      return {
        scenario: input.scenario,
        projectedPeakLatencyMs: round(baseLatency * 1.85, 1),
        projectedPeakTempC: round(baseOutlet + 11.2, 1),
        tripRiskComponents: ["Row-12", "Row-13", "CRAC-1"],
        mitigations: [
          "Immediate load shed 20% on Rows 12–13",
          "Engage free-cooling bypass if ambient < 18°C",
          "Failover to Zone-A secondary DLC loop",
        ],
      };
    case "network-brownout":
      return {
        scenario: input.scenario,
        projectedPeakLatencyMs: round(baseLatency + 38, 1),
        projectedPeakTempC: baseOutlet,
        tripRiskComponents: ["InfiniBand Spine-2", "Leaf-07 uplinks"],
        mitigations: [
          "Reroute east-west via Spine-1",
          "Notify training orchestrator — expect collective delays",
          "Stage southbound fiber failover",
        ],
      };
  }
}

function round(x: number, d = 0): number {
  const p = Math.pow(10, d);
  return Math.round(x * p) / p;
}

export function defaultSimulations(series: TelemetrySeries): SimulationOutput[] {
  return [
    runSimulation(series, { scenario: "load-plus-30", durationMinutes: 60 }),
    runSimulation(series, { scenario: "cooling-drop", durationMinutes: 30 }),
    runSimulation(series, { scenario: "network-brownout", durationMinutes: 45 }),
  ];
}
