import gpuSpecsJson from "@/data/gpu-specs.json";
import type { GPUSku, GPUSpec } from "@/lib/shared/types";
import { UnknownGpuError } from "@/lib/shared/types";
import type { M2Workload } from "../types";
import { computeRackLayout } from "./rackDensity";

const SPECS = (gpuSpecsJson as unknown as { gpus: GPUSpec[] }).gpus;

/**
 * GPU capital expense — amortized 4-year straight-line with 15% residual.
 * Uses channel-list MSRP from `gpu-specs.json` (cite: SemiAnalysis B200 Jun 2025,
 * NVIDIA DGX SuperPOD reference architecture, AMD MI300X spec).
 *
 * No silent fallback — unknown SKUs throw `UnknownGpuError`.
 */
export interface GPUCapexBreakdown {
  sku: GPUSku;
  totalSystems: number;
  systemMSRPUSD: number;
  totalCapexUSD: number;
  amortYears: number;
  residualPct: number;
  monthlyAmortUSD: number;
  cite_ids: string[];
}

export function computeGPUCapex(workload: M2Workload): GPUCapexBreakdown {
  const spec = SPECS.find((g) => g.sku === workload.gpu);
  if (!spec) throw new UnknownGpuError(workload.gpu);

  const { rackCount, systemsPerRack } = computeRackLayout(workload.gpu, workload.clusterMW);
  const totalSystems = rackCount * systemsPerRack;

  const totalCapex = totalSystems * spec.systemMSRPUSD;
  const amortYears = 4;
  const residualPct = 0.15;
  const monthlyAmort = (totalCapex * (1 - residualPct)) / (amortYears * 12);

  return {
    sku: spec.sku,
    totalSystems,
    systemMSRPUSD: spec.systemMSRPUSD,
    totalCapexUSD: totalCapex,
    amortYears,
    residualPct,
    monthlyAmortUSD: Math.round(monthlyAmort),
    cite_ids: spec.cite_ids,
  };
}
