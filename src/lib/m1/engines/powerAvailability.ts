import type { CandidateSite } from "@/lib/shared/types";
import type { EngineResult, M1Input } from "../types";

/**
 * Power Availability — NERC/FERC N-1 contingency framework.
 *
 * The formula: usable capacity after N-1 = (firmCapacity - peakLoad) × (1 - reserveMargin).
 * If `interconnectQueueMonths` exceeds a threshold, we apply a gating penalty — the site
 * may have power on paper but cannot be connected within the build window.
 */
export function powerAvailability(site: CandidateSite, input: M1Input): EngineResult {
  const s = (site.priorSignals ?? {}) as Record<string, number | string>;

  // Firm grid capacity and N-1 reserve (NERC/FERC TPL-001).
  const firm = (s.firmCapacityMW as number | undefined) ?? 5000;
  const n1 = (s.n1ContingencyMW as number | undefined) ?? firm * 0.08;
  const reserveMargin = n1 / firm;                          // 0..1
  const outageMin = (s.grid99PercentileOutageMin as number | undefined) ?? 180;
  const renewableShare = (s.renewableShare as number | undefined) ?? 0;
  const queueMonths = (s.interconnectQueueMonths as number | undefined) ?? 18;

  // Demand inflation: target buildout + 2× growth headroom.
  const headroomAsk = input.targetMW * 2;

  // After N-1, how much can we draw without destabilizing the grid?
  const usable = Math.max(0, (firm - headroomAsk) * (1 - reserveMargin));

  // Score: fraction of our ask that usable covers.
  const coverage = Math.min(1, usable / Math.max(1, input.targetMW));
  const baseScore = coverage * 100;

  // Stability (Uptime Institute global median ≈ 180 min/yr). 60 min → full; 300 min → 20.
  const stability = Math.max(0, Math.min(100, ((300 - outageMin) / 240) * 100));

  // Renewable share is a tiebreaker (ESG + spot hedge).
  const renewableScore = renewableShare * 100;

  // Queue penalty — 24+ months cuts score.
  const queuePenalty = queueMonths > 24 ? (queueMonths - 24) * 2 : 0;

  const raw = 0.55 * baseScore + 0.30 * stability + 0.15 * renewableScore - queuePenalty;
  const score = Math.max(0, Math.min(100, raw));

  const rationale =
    `Firm ${Math.round(firm)} MW, N-1 reserve ${(reserveMargin * 100).toFixed(1)}%, outage p99 ${outageMin} min/yr, ` +
    `queue ${queueMonths} mo, renewable ${(renewableShare * 100).toFixed(0)}% — covers ${(coverage * 100).toFixed(0)}% of ask.`;

  return {
    engineId: "powerAvailability",
    score: Math.round(score * 10) / 10,
    factors: {
      firmCapacityMW: firm,
      n1ContingencyMW: n1,
      reserveMarginPct: Math.round(reserveMargin * 1000) / 10,
      coveragePct: Math.round(coverage * 100),
      stabilityScore: Math.round(stability),
      renewableScore: Math.round(renewableScore),
      interconnectQueueMonths: queueMonths,
      queuePenalty: Math.round(queuePenalty),
    },
    rationale,
    cite_ids: ["ferc-n-1-standard", "uptime-aos-2024", "ember-electricity-2025"],
  };
}
