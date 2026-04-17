import type { M2Workload } from "../types";

/**
 * Staff + maintenance + insurance OpEx.
 *
 * Source: Uptime Institute 2024 Data Center Salary Survey + AOS 2024.
 * Model:
 *   staff = 0.6 FTE per MW × $180k fully loaded salary
 *   maintenance = 3% of gpu CapEx per year  (see gpuCapex engine; passed in)
 *   insurance = 0.4% of gpu CapEx per year
 * Result rolled up per month.
 */
export interface StaffOpexBreakdown {
  ftePerMW: number;
  loadedUSDPerFTE: number;
  staffUSDPerMonth: number;
  maintenancePct: number;
  insurancePct: number;
  maintenanceUSDPerMonth: number;
  insuranceUSDPerMonth: number;
  totalUSDPerMonth: number;
  cite_ids: string[];
}

export function computeStaffOpex(workload: M2Workload, gpuCapexUSD: number): StaffOpexBreakdown {
  const ftePerMW = 0.6;
  const loadedUSDPerFTE = 180_000;
  const totalFTE = ftePerMW * workload.clusterMW;
  const staffAnnual = totalFTE * loadedUSDPerFTE;

  const maintenancePct = 0.03;
  const insurancePct = 0.004;
  const maintenanceAnnual = gpuCapexUSD * maintenancePct;
  const insuranceAnnual = gpuCapexUSD * insurancePct;

  return {
    ftePerMW,
    loadedUSDPerFTE,
    staffUSDPerMonth: Math.round(staffAnnual / 12),
    maintenancePct,
    insurancePct,
    maintenanceUSDPerMonth: Math.round(maintenanceAnnual / 12),
    insuranceUSDPerMonth: Math.round(insuranceAnnual / 12),
    totalUSDPerMonth: Math.round((staffAnnual + maintenanceAnnual + insuranceAnnual) / 12),
    cite_ids: ["uptime-salary-survey-2024", "uptime-aos-2024"],
  };
}
