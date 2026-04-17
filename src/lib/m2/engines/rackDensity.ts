import gpuSpecsJson from "@/data/gpu-specs.json";
import type { GPUSku, GPUSpec } from "@/lib/shared/types";

const SPECS = (gpuSpecsJson as { gpus: GPUSpec[] }).gpus;

export function getGPUSpec(sku: GPUSku): GPUSpec {
  const spec = SPECS.find((g) => g.sku === sku);
  if (!spec) {
    throw new Error(`unknown GPU SKU: ${sku}`);
  }
  return spec;
}

/**
 * Compute rack layout for a target MW cluster given a GPU SKU.
 *
 * - `kWPerRack` comes from the GPU spec (GB200 NVL72 is naturally 120 kW/rack,
 *   B200 is ~70 kW/rack, H100/H200 ~50 kW/rack).
 * - `rackCount` = clusterMW * 1000 / kWPerRack.
 * - `systemsPerRack` = kWPerRack / systemTdpKW.
 * - `coolingMode` chosen by kWPerRack threshold.
 */
export function computeRackLayout(sku: GPUSku, clusterMW: number) {
  const spec = getGPUSpec(sku);
  const kWPerRack = spec.rackDensityKW;
  const rackCount = Math.ceil((clusterMW * 1000) / kWPerRack);
  const systemsPerRack = Math.max(1, Math.round(kWPerRack / spec.systemTdpKW));

  const coolingMode: "air" | "liquid-dlc" | "hybrid" | "immersion" =
    kWPerRack >= 100 ? "liquid-dlc" : kWPerRack >= 60 ? "hybrid" : "air";

  return {
    kWPerRack,
    rackCount,
    systemsPerRack,
    coolingMode,
    gpuCount: rackCount * systemsPerRack * spec.systemCount,
    interconnect: spec.interconnect,
  };
}
