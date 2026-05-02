"use client";

import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { M8Output } from "@/lib/m8/types";

function riskColor(risk: "low" | "medium" | "high"): "success" | "warning" | "error" {
  return risk === "low" ? "success" : risk === "medium" ? "warning" : "error";
}

export function TenantFitView({ output }: { output: M8Output }) {
  return (
    <Stack spacing={2}>
      <Paper elevation={0} sx={{ p: 2.5, border: "1px solid rgba(255,255,255,0.08)" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between">
          <Metric label="Sellable capacity" value={`${output.sellableMW.toFixed(2)} MW`} />
          <Metric label="Unallocated capacity" value={`${output.unallocatedMW.toFixed(2)} MW`} />
          <Metric label="Weighted price" value={`$${output.weightedPriceUSDPerMWh.toFixed(2)}/MWh`} />
          <Metric label="Projected revenue" value={`$${output.totalProjectedRevenueUSDm.toFixed(2)}M`} />
          <Metric label="Weighted margin" value={`${output.weightedGrossMarginPct.toFixed(1)}%`} />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Archetype</TableCell>
                <TableCell align="right">MW</TableCell>
                <TableCell align="right">Fit</TableCell>
                <TableCell align="right">Utilization</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Revenue</TableCell>
                <TableCell align="right">Margin</TableCell>
                <TableCell align="right">Risk</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {output.tenantFits.map((tenant) => (
                <TableRow key={tenant.tenantId} hover>
                  <TableCell>{tenant.archetype}</TableCell>
                  <TableCell align="right">{tenant.requiredMW.toFixed(2)}</TableCell>
                  <TableCell align="right">{tenant.fitScore.toFixed(1)}</TableCell>
                  <TableCell align="right">{tenant.expectedUtilizationPct.toFixed(1)}%</TableCell>
                  <TableCell align="right">${tenant.expectedPriceUSDPerMWh.toFixed(2)}</TableCell>
                  <TableCell align="right">${tenant.annualRevenueUSDm.toFixed(2)}M</TableCell>
                  <TableCell align="right">{tenant.grossMarginPct.toFixed(1)}%</TableCell>
                  <TableCell align="right">
                    <Chip size="small" label={tenant.risk} color={riskColor(tenant.risk)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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
