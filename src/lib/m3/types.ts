/**
 * M3 · Ops Control Tower — types.
 *
 * Operates on synthetic telemetry time-series. Each point is a minute-level
 * snapshot for a zone (row of racks). We surface:
 *   - live charts (power / cooling / latency / GPU util)
 *   - anomaly markers (z-score over rolling window)
 *   - 6-hour failure-probability forecast
 *   - RCA debate (Sonnet agents) with Opus synthesis
 *   - NL queries against the telemetry JSON
 *   - simulation mode (+N% load, CRAC drop, cascade test)
 */

export interface TelemetryPoint {
  t: string;                         // ISO
  powerKW: number;                   // total zone draw
  coolingKW: number;                 // CRAC + chiller loop
  inletTempC: number;                // cold-aisle average
  outletTempC: number;               // hot-aisle average
  gpuUtilPct: number;
  latencyP99Ms: number;
  pduLoadPct: number;
  pduId: string;
  crac: Record<string, number>;      // e.g. { "CRAC-1": setpointC, ... }
}

export interface TelemetrySeries {
  incidentId: string;
  zone: string;
  facility: string;
  facilityId: string;
  startTime: string;
  endTime: string;
  points: TelemetryPoint[];
  annotations: {
    t: string;
    note: string;
    severity: "info" | "warn" | "critical";
  }[];
}

// ---- Anomaly detection -------------------------------------------------

export interface Anomaly {
  t: string;
  metric: keyof TelemetryPoint | string;
  value: number;
  zscore: number;
  severity: "low" | "medium" | "high";
  note?: string;
}

// ---- Failure prediction ------------------------------------------------

export interface FailureRisk {
  component: string;                 // e.g. "PDU-4"
  probabilityPct: number;            // 0..100
  horizonHours: number;
  drivers: string[];
}

// ---- Simulation mode ---------------------------------------------------

export interface SimulationInput {
  scenario: "load-plus-30" | "cooling-drop" | "network-brownout";
  durationMinutes: number;
}

export interface SimulationOutput {
  scenario: SimulationInput["scenario"];
  projectedPeakLatencyMs: number;
  projectedPeakTempC: number;
  tripRiskComponents: string[];
  mitigations: string[];
}

export interface M3Input {
  incidentId: string;
  startTime: string;
  zone: string;
  telemetryPreset: string;
}

export interface M3Output {
  input: M3Input;
  series: TelemetrySeries;
  anomalies: Anomaly[];
  failureRisks: FailureRisk[];
  simulations: SimulationOutput[];
  generatedAt: string;
}
