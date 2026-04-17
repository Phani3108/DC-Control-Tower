"use client";

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import type { CompetitorComparison } from "@/lib/m2/types";

interface Props {
  comparisons: CompetitorComparison[];
  damacUSDMWh: number;
}

export function ComparisonTable({ comparisons, damacUSDMWh }: Props) {
  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        Competitor benchmark · DAMAC blended ${damacUSDMWh.toFixed(1)} / MWh
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Competitor</TableCell>
            <TableCell align="right">Midband $/MWh</TableCell>
            <TableCell align="right">DAMAC delta</TableCell>
            <TableCell>Note</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {comparisons.map((c) => {
            const midband = Math.round((c.pricePerMWhUSDBand[0] + c.pricePerMWhUSDBand[1]) / 2);
            const color = c.priceDeltaPctVsDAMAC > 0 ? "success" : c.priceDeltaPctVsDAMAC < 0 ? "error" : "default";
            return (
              <TableRow key={c.competitorId}>
                <TableCell>{c.competitorName}</TableCell>
                <TableCell align="right">${midband}</TableCell>
                <TableCell align="right">
                  <Chip
                    size="small"
                    label={`${c.priceDeltaPctVsDAMAC >= 0 ? "+" : ""}${c.priceDeltaPctVsDAMAC}%`}
                    color={color as "success" | "error" | "default"}
                    variant="outlined"
                    sx={{ fontWeight: 600, height: 20 }}
                  />
                </TableCell>
                <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>{c.notes}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
  );
}
