import type { BuildMilestone, BuildRisk, M5Input, M5Output } from "../types";

interface MilestoneTemplate {
  id: string;
  name: string;
  owner: string;
  category: BuildMilestone["category"];
  dependsOn: string[];
  baseDurationDays: number;
  permitWeight: number;
  utilityWeight: number;
  leadWeight: number;
  epcWeight: number;
}

const MILESTONES: MilestoneTemplate[] = [
  {
    id: "site-dd",
    name: "Site due diligence complete",
    owner: "Development",
    category: "predevelopment",
    dependsOn: [],
    baseDurationDays: 28,
    permitWeight: 0.2,
    utilityWeight: 0.1,
    leadWeight: 0,
    epcWeight: 0.1,
  },
  {
    id: "permit-pack",
    name: "Permitting package approved",
    owner: "Permits",
    category: "permits",
    dependsOn: ["site-dd"],
    baseDurationDays: 120,
    permitWeight: 1.2,
    utilityWeight: 0.2,
    leadWeight: 0,
    epcWeight: 0.2,
  },
  {
    id: "utility-ia",
    name: "Utility interconnect agreement",
    owner: "Utilities",
    category: "utility",
    dependsOn: ["permit-pack"],
    baseDurationDays: 150,
    permitWeight: 0.2,
    utilityWeight: 1.4,
    leadWeight: 0,
    epcWeight: 0.1,
  },
  {
    id: "long-lead-po",
    name: "Long-lead equipment on order",
    owner: "Procurement",
    category: "procurement",
    dependsOn: ["permit-pack"],
    baseDurationDays: 110,
    permitWeight: 0.1,
    utilityWeight: 0,
    leadWeight: 1.4,
    epcWeight: 0.2,
  },
  {
    id: "core-shell",
    name: "Core and shell complete",
    owner: "EPC",
    category: "construction",
    dependsOn: ["permit-pack"],
    baseDurationDays: 180,
    permitWeight: 0.3,
    utilityWeight: 0,
    leadWeight: 0.3,
    epcWeight: 1.2,
  },
  {
    id: "mep-ready",
    name: "MEP and cooling systems integrated",
    owner: "EPC + Vendors",
    category: "construction",
    dependsOn: ["utility-ia", "long-lead-po", "core-shell"],
    baseDurationDays: 150,
    permitWeight: 0,
    utilityWeight: 0.6,
    leadWeight: 1.2,
    epcWeight: 1,
  },
  {
    id: "commissioning",
    name: "Integrated systems commissioning",
    owner: "Commissioning",
    category: "commissioning",
    dependsOn: ["mep-ready"],
    baseDurationDays: 60,
    permitWeight: 0,
    utilityWeight: 0.3,
    leadWeight: 0.4,
    epcWeight: 1,
  },
  {
    id: "energization",
    name: "Facility energized",
    owner: "Utilities + Ops",
    category: "commissioning",
    dependsOn: ["commissioning"],
    baseDurationDays: 14,
    permitWeight: 0,
    utilityWeight: 1,
    leadWeight: 0.2,
    epcWeight: 0.3,
  },
];

const CATEGORY_WEIGHT: Record<BuildMilestone["category"], number> = {
  predevelopment: 0.5,
  permits: 1.1,
  utility: 1.2,
  procurement: 1,
  construction: 0.9,
  commissioning: 0.8,
};

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(dateIso: string, days: number): string {
  const d = new Date(`${dateIso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toIsoDate(d);
}

function diffDays(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00Z`).getTime();
  const to = new Date(`${toIso}T00:00:00Z`).getTime();
  return Math.max(0, Math.round((to - from) / (24 * 60 * 60 * 1000)));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function buildRisks(input: M5Input, capexBaseUSDm: number): BuildRisk[] {
  const permitPressure = clamp(25 + input.permitComplexity * 11, 15, 90);
  const utilityPressure = clamp(18 + input.utilityQueueMonths * 1.8, 15, 95);
  const leadPressure = clamp(22 + input.longLeadTightness * 12, 15, 95);
  const epcPressure = clamp(48 - input.epcReadiness * 7, 12, 80);

  const risks: Omit<BuildRisk, "exposureUSDm" | "severity">[] = [
    {
      id: "r-permit",
      title: "Permit resubmission cycle",
      category: "permits",
      probabilityPct: permitPressure,
      impactDays: 35 + input.permitComplexity * 6,
      impactUSDm: capexBaseUSDm * 0.02,
      mitigation: "Freeze permit package scope and run weekly pre-submission checks with local counsel.",
    },
    {
      id: "r-utility",
      title: "Utility energization queue slip",
      category: "utility",
      probabilityPct: utilityPressure,
      impactDays: 20 + Math.round(input.utilityQueueMonths * 1.5),
      impactUSDm: capexBaseUSDm * 0.028,
      mitigation: "Lock interconnect milestones with utility PMO and secure temporary power fallback.",
    },
    {
      id: "r-longlead",
      title: "Long-lead equipment delay (switchgear/transformers/chillers)",
      category: "procurement",
      probabilityPct: leadPressure,
      impactDays: 24 + input.longLeadTightness * 8,
      impactUSDm: capexBaseUSDm * 0.025,
      mitigation: "Dual-source critical packages and pull forward factory acceptance tests.",
    },
    {
      id: "r-epc",
      title: "EPC productivity shortfall",
      category: "construction",
      probabilityPct: epcPressure,
      impactDays: 18 + (6 - input.epcReadiness) * 7,
      impactUSDm: capexBaseUSDm * 0.018,
      mitigation: "Re-baseline labor curves and tie package-level incentives to critical-path output.",
    },
    {
      id: "r-commission",
      title: "Commissioning rework loop",
      category: "commissioning",
      probabilityPct: clamp((leadPressure + epcPressure) / 2 - 4, 10, 80),
      impactDays: 14 + input.longLeadTightness * 4,
      impactUSDm: capexBaseUSDm * 0.015,
      mitigation: "Run staged dry-commissioning and full-sequence integrated systems test.",
    },
  ];

  return risks.map((risk) => {
    const exposureUSDm = (risk.probabilityPct / 100) * risk.impactUSDm;
    const severity: BuildRisk["severity"] =
      exposureUSDm >= capexBaseUSDm * 0.012 ? "high" : exposureUSDm >= capexBaseUSDm * 0.006 ? "medium" : "low";

    return {
      ...risk,
      exposureUSDm: Number(exposureUSDm.toFixed(2)),
      severity,
      impactUSDm: Number(risk.impactUSDm.toFixed(2)),
    };
  });
}

export function runM5(input: M5Input): M5Output {
  const permitFactor = 1 + (input.permitComplexity - 3) * 0.12;
  const utilityFactor = 1 + input.utilityQueueMonths / 30;
  const leadFactor = 1 + (input.longLeadTightness - 3) * 0.14;
  const epcFactor = 1 + (3 - input.epcReadiness) * 0.1;

  const capexBaseUSDm = input.targetMW * 8.2;

  const computed = new Map<
    string,
    {
      p50Start: string;
      p50Finish: string;
      p90Finish: string;
      slipProbabilityPct: number;
      durationDays: number;
    }
  >();

  const milestones: BuildMilestone[] = MILESTONES.map((m) => {
    const pressure =
      m.permitWeight * (permitFactor - 1) +
      m.utilityWeight * (utilityFactor - 1) +
      m.leadWeight * (leadFactor - 1) +
      m.epcWeight * (epcFactor - 1);

    const durationDays = Math.max(7, Math.round(m.baseDurationDays * (1 + pressure * 0.55)));

    const depFinishP50 =
      m.dependsOn.length === 0
        ? input.plannedNoticeToProceed
        : m.dependsOn
            .map((id) => computed.get(id)?.p50Finish ?? input.plannedNoticeToProceed)
            .sort()
            .at(-1) ?? input.plannedNoticeToProceed;

    const depFinishP90 =
      m.dependsOn.length === 0
        ? input.plannedNoticeToProceed
        : m.dependsOn
            .map((id) => computed.get(id)?.p90Finish ?? input.plannedNoticeToProceed)
            .sort()
            .at(-1) ?? input.plannedNoticeToProceed;

    const p50Finish = addDays(depFinishP50, durationDays);

    const slipProbabilityPct = clamp(
      12 + (input.permitComplexity - 1) * 6 * m.permitWeight +
        input.utilityQueueMonths * 0.45 * m.utilityWeight +
        input.longLeadTightness * 6 * m.leadWeight +
        (6 - input.epcReadiness) * 5 * m.epcWeight +
        CATEGORY_WEIGHT[m.category] * 8,
      8,
      88,
    );

    const p90Buffer = Math.round(durationDays * (slipProbabilityPct / 100) * 0.75);
    const p90Finish = addDays(depFinishP90, durationDays + p90Buffer);

    computed.set(m.id, {
      p50Start: depFinishP50,
      p50Finish,
      p90Finish,
      slipProbabilityPct,
      durationDays,
    });

    return {
      id: m.id,
      name: m.name,
      owner: m.owner,
      category: m.category,
      dependsOn: m.dependsOn,
      durationDays,
      slipProbabilityPct: Number(slipProbabilityPct.toFixed(1)),
      p50Finish,
      p90Finish,
      critical: m.id === "energization" || m.id === "mep-ready" || m.id === "commissioning",
    };
  });

  const p50EnergizationDate = computed.get("energization")?.p50Finish ?? input.plannedNoticeToProceed;
  const p90EnergizationDate = computed.get("energization")?.p90Finish ?? p50EnergizationDate;
  const scheduleSpreadDays = diffDays(p50EnergizationDate, p90EnergizationDate);

  const risks = buildRisks(input, capexBaseUSDm).sort((a, b) => b.exposureUSDm - a.exposureUSDm);
  const capexAtRiskUSDm = Number(
    risks.reduce((sum, r) => sum + r.exposureUSDm, 0).toFixed(2),
  );

  const recommendations = [
    `Prioritize ${risks[0]?.title.toLowerCase()} with a weekly executive gate until exposure drops below ${Math.round(risks[0]?.probabilityPct ?? 0)}%.`,
    `Protect energization by preserving a ${input.contingencyPct}% schedule contingency and pre-approving scope swaps for long-lead packages.`,
    `Lock utility and EPC milestones into a shared critical-path control room with one owner per blocker.`,
  ];

  return {
    input,
    milestones,
    risks,
    p50EnergizationDate,
    p90EnergizationDate,
    scheduleSpreadDays,
    capexAtRiskUSDm,
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}
