import type { Anomaly, FailureRisk, TelemetrySeries } from "../types";

/**
 * Heuristic failure predictor.
 *
 * Correlates recent anomalies to component-level risk. Demo-grade:
 * - Sustained high outlet temperature → CRAC risk
 * - PDU load > 78% sustained → PDU trip risk
 * - Latency spike + rising temperature → Row-level GPU thermal throttle
 */
export function predictFailures(
  series: TelemetrySeries,
  anomalies: Anomaly[],
): FailureRisk[] {
  const recent = anomalies.slice(-20);
  const highTempCount = recent.filter(
    (a) => a.metric === "outletTempC" && a.severity !== "low",
  ).length;
  const highPDUCount = recent.filter(
    (a) => a.metric === "pduLoadPct" && a.severity !== "low",
  ).length;
  const latencySpikes = recent.filter(
    (a) => a.metric === "latencyP99Ms" && a.severity === "high",
  ).length;

  const risks: FailureRisk[] = [];

  if (highTempCount > 3) {
    risks.push({
      component: "CRAC-3",
      probabilityPct: Math.min(65, 18 + highTempCount * 5),
      horizonHours: 6,
      drivers: [
        "setpoint drift detected",
        "outlet temp z-score sustained above baseline",
        "Row 12 GPU thermal throttle correlated",
      ],
    });
  }

  if (highPDUCount > 4 || series.points.some((p) => p.pduLoadPct > 80)) {
    risks.push({
      component: "PDU-4",
      probabilityPct: Math.min(58, 12 + highPDUCount * 4),
      horizonHours: 6,
      drivers: [
        "PDU load > 78% sustained",
        "breaker trip curve approaching",
        "load imbalance with PDU-3",
      ],
    });
  }

  if (latencySpikes > 2) {
    risks.push({
      component: "Row-12 thermal margin",
      probabilityPct: Math.min(72, 20 + latencySpikes * 6),
      horizonHours: 3,
      drivers: [
        "GPU util dropped as throttle engaged",
        "p99 latency beyond 8σ from baseline",
        "secondary cooling loop not yet rebalanced",
      ],
    });
  }

  return risks.sort((a, b) => b.probabilityPct - a.probabilityPct);
}
