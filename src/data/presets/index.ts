/**
 * Demo presets.
 *
 * Every interview walkthrough loads a URL-encoded preset. The preset ID
 * (e.g. `m1-sea-500mw`) deterministically loads the input scenario and —
 * in mock mode — replays a cached agent response from disk.
 *
 * Rule: no live typing during the interview. Every demo path is a preset.
 */

import type { DemoPreset } from "@/lib/shared/types";

export interface M1Input {
  targetMW: number;
  region: "ME" | "EU" | "APAC" | "US";
  workloadProfile: "hyperscale-training" | "sovereign-inference" | "edge";
  candidateSiteIds: string[];
}

export interface M2Input {
  rfpText?: string;
  workload: {
    shape: "training" | "inference" | "mixed";
    gpu: "H100" | "H200" | "B200" | "GB200-NVL72" | "MI300X";
    clusterMW: number;
    latencySLAms?: number;
    customerGeography?: string;
    dataGeography?: string;
  };
}

export interface M3Input {
  incidentId: string;
  startTime: string;       // ISO
  zone: string;
  telemetryPreset: string;  // key into `data/demo-telemetry/`
}

export interface M4Input {
  workloadCategory: "fintech-inference" | "health-training" | "public-sector-inference" | "general-inference";
  customerDataCountries: string[];    // ISO
  candidateFacilityIds: string[];
}

// ---------------------------------------------------------------------------

export const PRESETS: Record<string, DemoPreset> = {
  "m1-sea-500mw": {
    id: "m1-sea-500mw",
    module: "m1",
    title: "Next 500 MW — Southeast Asia",
    description:
      "Board-level question: where should DAMAC deploy the next 500 MW of hyperscale AI training capacity in SEA? Weigh Jakarta-2 expansion vs. Johor vs. Bangkok expansion.",
    input: {
      targetMW: 500,
      region: "APAC",
      workloadProfile: "hyperscale-training",
      candidateSiteIds: ["jakarta-ext", "johor", "bangkok-ext", "batam"],
    } satisfies M1Input,
    expectedHighlights: [
      "Johor scores highest on power cost + talent; flagged on sovereignty fit",
      "Jakarta-2 extension wins on customer proximity + existing permit",
      "Bangkok has the cheapest land but limited grid headroom",
      "IC memo recommends Johor-primary + Jakarta-secondary split",
    ],
  },

  "m2-anthropic-b200-40mw": {
    id: "m2-anthropic-b200-40mw",
    module: "m2",
    title: "40 MW B200 training cluster — frontier lab customer",
    description:
      "Paste a representative RFP from a frontier lab asking for 40 MW of B200-class capacity with 24-month ramp. Match to DAMAC facilities and draft a proposal.",
    input: {
      rfpText:
        "We require 40 MW of AI training capacity (B200 SXM, 8-GPU DGX systems) with ramp-up to 100 MW over 24 months. Latency SLA <20 ms to AWS us-east-1 peering. Data residency flexible for weights; training data is non-PII scraped web. PUE target ≤1.35, renewable share ≥60%. Budget <$140/MWh all-in.",
      workload: {
        shape: "training",
        gpu: "B200",
        clusterMW: 40,
        latencySLAms: 20,
        customerGeography: "US",
        dataGeography: "US",
      },
    } satisfies M2Input,
    expectedHighlights: [
      "Virginia Loudoun (us-va-1) wins on latency + budget + renewables",
      "Texas Abilene fallback; higher PUE but cheaper power",
      "Madrid viable only if EU AI Act deemed acceptable; adds latency",
      "Proposal draft: 2-phase build — 20 MW Loudoun Q3, 20 MW Q1 next year",
    ],
  },

  "m3-zoneb-latency-0417": {
    id: "m3-zoneb-latency-0417",
    module: "m3",
    title: "Zone B latency spike — Riyadh-1, 04:17 UTC",
    description:
      "Synthetic incident: Riyadh-1 Zone B latency p99 spiked from 6.2 ms → 83.4 ms over 40 minutes. Root cause debate + 6-hour risk forecast.",
    input: {
      incidentId: "INC-2026-0417-01",
      startTime: "2026-04-17T04:17:00Z",
      zone: "Riyadh-1/Zone-B",
      telemetryPreset: "zoneb-latency-0417",
    } satisfies M3Input,
    expectedHighlights: [
      "Correlation: CRAC-3 setpoint drift + Row 12 GPU thermal throttle",
      "Debate converges on cooling-first RCA; InfraAgent dissents toward PDU",
      "6-hour risk: PDU-4 failure probability 18% (baseline 3%)",
      "Mitigation queue: rebalance cooling + preemptive rack migration",
    ],
  },

  "m4-ksa-fintech-eu-data": {
    id: "m4-ksa-fintech-eu-data",
    module: "m4",
    title: "Saudi fintech inference — EU customer data",
    description:
      "Fintech serving EU customers wants to run inference in Saudi Arabia on DAMAC's Riyadh campus. Where can the model and data actually live?",
    input: {
      workloadCategory: "fintech-inference",
      customerDataCountries: ["ES", "GR", "DE", "FR"],
      candidateFacilityIds: ["riyadh-1", "madrid-1", "athens-1", "uae-dxb-1"],
    } satisfies M4Input,
    expectedHighlights: [
      "Riyadh blocked for EU PII (SCCs alone insufficient); requires adequacy",
      "Madrid-1 cleanest path; EU AI Act transparency still required",
      "Athens-1 equivalent to Madrid; lower cost",
      "Recommendation: primary Madrid, Riyadh only for non-PII aggregated telemetry",
    ],
  },
};

export function getPreset(id: string): DemoPreset | undefined {
  return PRESETS[id];
}

export function listPresetsForModule(module: "m1" | "m2" | "m3" | "m4"): DemoPreset[] {
  return Object.values(PRESETS).filter((p) => p.module === module);
}
