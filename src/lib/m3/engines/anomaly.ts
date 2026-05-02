import type { Anomaly, TelemetrySeries } from "../types";

/**
 * Rolling z-score anomaly detection.
 *
 * For each metric of interest, compute mean/std over the first `windowSize`
 * points, then score each subsequent point against that baseline. A |z| > 3
 * is "high" severity; > 2 is "medium"; > 1.5 is "low".
 */

const METRICS = ["inletTempC", "outletTempC", "latencyP99Ms", "pduLoadPct"] as const;
type Metric = (typeof METRICS)[number];

const WINDOW = 15; // first 15 minutes establish baseline

export function detectAnomalies(series: TelemetrySeries): Anomaly[] {
  const pts = series.points;
  if (pts.length < WINDOW + 1) return [];

  const baselineSlice = pts.slice(0, WINDOW);
  const baseline: Record<Metric, { mean: number; std: number }> = {} as never;
  for (const m of METRICS) {
    const values = baselineSlice.map((p) => p[m] as number);
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
    baseline[m] = { mean, std: Math.sqrt(variance) || 0.001 };
  }

  const anomalies: Anomaly[] = [];
  for (const pt of pts.slice(WINDOW)) {
    for (const m of METRICS) {
      const v = pt[m] as number;
      const { mean, std } = baseline[m];
      const z = (v - mean) / std;
      const absZ = Math.abs(z);
      if (absZ < 1.5) continue;
      const severity = absZ >= 3 ? "high" : absZ >= 2 ? "medium" : "low";
      anomalies.push({
        t: pt.t,
        metric: m,
        value: v,
        zscore: Math.round(z * 100) / 100,
        severity,
        note: z > 0 ? "above baseline" : "below baseline",
      });
    }
  }
  return anomalies;
}
