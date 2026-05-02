"use client";

import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { M7Output } from "@/lib/m7/types";

export function PowerBalanceView({ output }: { output: M7Output }) {
  return (
    <Stack spacing={2}>
      <Paper elevation={0} sx={{ p: 2.5, border: "1px solid rgba(255,255,255,0.08)" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between">
          <Metric label="Gross facility load" value={`${output.grossFacilityMW.toFixed(2)} MW`} />
          <Metric label="Firm available" value={`${output.firmAvailableMW.toFixed(2)} MW`} />
          <Metric label="Reserve headroom" value={`${output.reserveHeadroomMW.toFixed(2)} MW`} />
          <Metric label="Curtailed load" value={`${output.curtailedLoadMW.toFixed(2)} MW`} />
          <Metric label="Battery runtime" value={`${output.batteryRuntimeMinAtDeficit.toFixed(1)} min`} />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5, border: "1px solid rgba(255,255,255,0.08)" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between">
          <Metric label="Blended power cost" value={`$${output.blendedPowerCostUSDPerMWh.toFixed(2)}/MWh`} />
          <Metric label="Annual power cost" value={`$${output.annualPowerCostUSDm.toFixed(2)}M`} />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Window</TableCell>
                <TableCell align="right">Utility</TableCell>
                <TableCell align="right">On-site</TableCell>
                <TableCell align="right">Battery</TableCell>
                <TableCell align="right">Margin</TableCell>
                <TableCell align="right">Marginal cost</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {output.dispatchPlan.map((slot) => (
                <TableRow key={slot.slotId} hover>
                  <TableCell>{slot.label}</TableCell>
                  <TableCell align="right">{slot.utilityMW.toFixed(2)} MW</TableCell>
                  <TableCell align="right">{slot.onsiteMW.toFixed(2)} MW</TableCell>
                  <TableCell align="right">{slot.batteryDischargeMW.toFixed(2)} MW</TableCell>
                  <TableCell align="right">{slot.expectedMarginMW.toFixed(2)} MW</TableCell>
                  <TableCell align="right">${slot.marginalCostUSDPerMWh.toFixed(2)}</TableCell>
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
