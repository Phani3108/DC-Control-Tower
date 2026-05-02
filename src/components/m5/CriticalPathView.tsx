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
import type { M5Output } from "@/lib/m5/types";

export function CriticalPathView({ output }: { output: M5Output }) {
  return (
    <Stack spacing={2}>
      <Paper elevation={0} sx={{ p: 2.5, border: "1px solid rgba(255,255,255,0.08)" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between">
          <BoxMetric label="P50 energization" value={output.p50EnergizationDate} />
          <BoxMetric label="P90 energization" value={output.p90EnergizationDate} />
          <BoxMetric label="Schedule spread" value={`${output.scheduleSpreadDays} days`} />
          <BoxMetric label="Capex at risk" value={`$${output.capexAtRiskUSDm.toFixed(2)}M`} />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Milestone</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell align="right">Duration</TableCell>
                <TableCell align="right">Slip %</TableCell>
                <TableCell>P50 finish</TableCell>
                <TableCell>P90 finish</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {output.milestones.map((m) => (
                <TableRow key={m.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2">{m.name}</Typography>
                      {m.critical && <Chip size="small" label="Critical" color="warning" sx={{ height: 18 }} />}
                    </Stack>
                  </TableCell>
                  <TableCell>{m.owner}</TableCell>
                  <TableCell align="right">{m.durationDays}d</TableCell>
                  <TableCell align="right">{m.slipProbabilityPct.toFixed(1)}%</TableCell>
                  <TableCell>{m.p50Finish}</TableCell>
                  <TableCell>{m.p90Finish}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  );
}

function BoxMetric({ label, value }: { label: string; value: string }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6">{value}</Typography>
    </Stack>
  );
}
