"use client";

import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import Divider from "@mui/material/Divider";
import type { M8Output } from "@/lib/m8/types";

export function RevenueView({ output }: { output: M8Output }) {
  const totalRevenue = Math.max(output.totalProjectedRevenueUSDm, 0.01);

  return (
    <Stack spacing={2}>
      <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
        <Typography variant="overline" color="text.secondary">
          Revenue mix by tenant archetype
        </Typography>
        <Stack spacing={1.6} sx={{ mt: 1.5 }}>
          {output.tenantFits.map((tenant) => {
            const share = (tenant.annualRevenueUSDm / totalRevenue) * 100;
            return (
              <Stack key={tenant.tenantId} spacing={0.5}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">{tenant.archetype}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    ${tenant.annualRevenueUSDm.toFixed(2)}M · {share.toFixed(1)}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.max(4, share)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Stack>
            );
          })}
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
          <Metric label="Payback P50" value={`${output.paybackMonthsP50.toFixed(1)} months`} />
          <Metric label="Payback P90" value={`${output.paybackMonthsP90.toFixed(1)} months`} />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
        <Typography variant="overline" color="text.secondary">
          Scenario envelope
        </Typography>
        <Stack spacing={1.3} sx={{ mt: 1.5 }}>
          {output.revenueScenarios.map((scenario) => (
            <Stack key={scenario.scenarioId} direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">{scenario.label}</Typography>
              <Typography variant="caption" color="text.secondary">
                ${scenario.annualRevenueUSDm.toFixed(2)}M · margin {scenario.grossMarginPct.toFixed(1)}% · occupancy {scenario.occupancyPct.toFixed(1)}%
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6">{value}</Typography>
    </Stack>
  );
}
