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
import type { M6Output } from "@/lib/m6/types";

export function CoolingEfficiencyView({ output }: { output: M6Output }) {
  return (
    <Stack spacing={2}>
      <Paper elevation={0} sx={{ p: 2.5, border: "1px solid rgba(255,255,255,0.08)" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between">
          <Metric label="Current PUE" value={output.currentPUE.toFixed(3)} />
          <Metric label="Optimized PUE (P50)" value={output.optimizedPUEP50.toFixed(3)} />
          <Metric label="Optimized PUE (P90)" value={output.optimizedPUEP90.toFixed(3)} />
          <Metric label="Cooling savings" value={`${output.coolingEnergySavingsPct.toFixed(1)}%`} />
          <Metric label="Annual savings" value={`$${output.annualSavingsUSDm.toFixed(2)}M`} />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Zone</TableCell>
                <TableCell align="right">Supply temp</TableCell>
                <TableCell align="right">Fan speed</TableCell>
                <TableCell align="right">Chiller load</TableCell>
                <TableCell align="right">Expected PUE</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {output.setpointPlan.map((zone) => (
                <TableRow key={zone.zoneId} hover>
                  <TableCell>{zone.zoneName}</TableCell>
                  <TableCell align="right">{zone.supplyTempC.toFixed(1)}°C</TableCell>
                  <TableCell align="right">{zone.fanSpeedPct.toFixed(1)}%</TableCell>
                  <TableCell align="right">{zone.chillerLoadPct.toFixed(1)}%</TableCell>
                  <TableCell align="right">{zone.expectedPUE.toFixed(3)}</TableCell>
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
