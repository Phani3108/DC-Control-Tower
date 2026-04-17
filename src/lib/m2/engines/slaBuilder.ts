import type { DAMACFacility } from "@/lib/shared/types";
import type { M2Workload, SLADraft } from "../types";

/**
 * Build a default SLA draft for a facility + workload. Tier III → 99.982%,
 * Tier IV → 99.995%, with redundancy claims taken from the facility record.
 */
export function buildSLADraft(facility: DAMACFacility, workload: M2Workload): SLADraft {
  const availabilityTarget =
    facility.tier === "IV" ? "99.995% (Tier IV)" : "99.982% (Tier III)";

  const isTraining = workload.shape === "training";

  return {
    availabilityTarget,
    powerRedundancy: facility.tier === "IV" ? "2N + 1" : "N + 1",
    coolingRedundancy: facility.tier === "IV" ? "2N (dedicated DLC loops)" : "N + 1 CRAC",
    networkRedundancy: "2x 400 Gbps diverse fiber paths; Tier-1 IX peering",
    creditsSchedule:
      "10% monthly fee credit per 0.1% below target availability, capped at 50% of monthly fee",
    incidentResponseMin: isTraining ? 30 : 15,
  };
}
