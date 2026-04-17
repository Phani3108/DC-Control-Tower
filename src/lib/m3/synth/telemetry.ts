import type { TelemetryPoint, TelemetrySeries } from "../types";

/**
 * Deterministic synthetic telemetry generator.
 *
 * We generate a 90-minute window around an incident. Baseline is quiet; a
 * ramp between t+10 and t+50 introduces the anomaly (e.g. latency spike from
 * cooling drift). Post-t+60 we show a mitigation trend.
 *
 * Uses a simple mulberry32 PRNG seeded by incidentId so runs are repeatable.
 */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface SynthOptions {
  incidentId: string;
  zone: string;
  facility: string;
  facilityId: string;
  startTime: string;         // ISO — anomaly onset
  baselinePowerKW: number;
  baselineLatencyMs: number;
  minutesBefore: number;
  minutesAfter: number;
  anomalyProfile: "latency-spike" | "thermal-runaway" | "pdu-wobble";
}

export function generateTelemetry(opts: SynthOptions): TelemetrySeries {
  const rand = mulberry32(seedFromString(opts.incidentId));
  const anchor = new Date(opts.startTime).getTime();
  const totalMinutes = opts.minutesBefore + opts.minutesAfter;
  const points: TelemetryPoint[] = [];
  const annotations: TelemetrySeries["annotations"] = [];

  for (let m = -opts.minutesBefore; m <= opts.minutesAfter; m++) {
    const t = new Date(anchor + m * 60_000).toISOString();

    // Baseline with small jitter
    let power = opts.baselinePowerKW + (rand() - 0.5) * 4;
    let cooling = power * 0.35 + (rand() - 0.5) * 2;
    let inletTemp = 22 + (rand() - 0.5) * 0.8;
    let outletTemp = 34 + (rand() - 0.5) * 1.2;
    let gpuUtil = 72 + (rand() - 0.5) * 8;
    let latency = opts.baselineLatencyMs + (rand() - 0.5) * 1.2;
    let pduLoad = 58 + (rand() - 0.5) * 4;
    const crac: Record<string, number> = {
      "CRAC-1": 21 + (rand() - 0.5) * 0.3,
      "CRAC-2": 21 + (rand() - 0.5) * 0.3,
      "CRAC-3": 21 + (rand() - 0.5) * 0.3,
    };

    // Incident window — inject the anomaly profile
    if (m >= 0 && m <= 40) {
      const rampProgress = Math.min(1, m / 20); // 0..1 over first 20 min
      const decayProgress = m > 20 ? (m - 20) / 20 : 0;

      if (opts.anomalyProfile === "latency-spike") {
        // CRAC-3 drifts → thermal throttle Row 12 → latency spike
        crac["CRAC-3"] = 21 + rampProgress * 6;  // setpoint drifts up
        inletTemp += rampProgress * 4 - decayProgress * 2;
        outletTemp += rampProgress * 6 - decayProgress * 3;
        latency = opts.baselineLatencyMs + rampProgress * 75 - decayProgress * 35;
        gpuUtil -= rampProgress * 12;
        pduLoad += rampProgress * 6;
      } else if (opts.anomalyProfile === "thermal-runaway") {
        inletTemp += rampProgress * 6;
        outletTemp += rampProgress * 10;
        power += rampProgress * 30;
        cooling += rampProgress * 20;
      } else if (opts.anomalyProfile === "pdu-wobble") {
        pduLoad += rampProgress * 22;
        power += (rand() - 0.5) * 30 * rampProgress;
      }
    }

    points.push({
      t,
      powerKW: round(power, 1),
      coolingKW: round(cooling, 1),
      inletTempC: round(inletTemp, 2),
      outletTempC: round(outletTemp, 2),
      gpuUtilPct: round(gpuUtil, 1),
      latencyP99Ms: round(latency, 2),
      pduLoadPct: round(pduLoad, 1),
      pduId: "PDU-4",
      crac,
    });

    // Annotations
    if (m === 0) annotations.push({ t, note: "Anomaly onset detected", severity: "warn" });
    if (m === 15) annotations.push({ t, note: "SRE paged — INC-2026-0417-01", severity: "critical" });
    if (m === 25) annotations.push({ t, note: "Cooling rebalance in progress", severity: "info" });
    if (m === 40) annotations.push({ t, note: "Latency approaching baseline", severity: "info" });
  }

  return {
    incidentId: opts.incidentId,
    zone: opts.zone,
    facility: opts.facility,
    facilityId: opts.facilityId,
    startTime: points[0].t,
    endTime: points[points.length - 1].t,
    points,
    annotations,
  };
}

function round(x: number, d = 0): number {
  const p = Math.pow(10, d);
  return Math.round(x * p) / p;
}

/** Preset registry. */
export const TELEMETRY_PRESETS: Record<string, SynthOptions> = {
  "zoneb-latency-0417": {
    incidentId: "INC-2026-0417-01",
    zone: "Riyadh-1 / Zone-B",
    facility: "Riyadh AI Campus",
    facilityId: "riyadh-1",
    startTime: "2026-04-17T04:17:00Z",
    baselinePowerKW: 2400,
    baselineLatencyMs: 6.2,
    minutesBefore: 30,
    minutesAfter: 60,
    anomalyProfile: "latency-spike",
  },
};
