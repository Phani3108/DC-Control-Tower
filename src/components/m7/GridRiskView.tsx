"use client";

import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import type { M7Output } from "@/lib/m7/types";

const SEVERITY_COLOR: Record<string, "success" | "warning" | "error"> = {
  low: "success",
  medium: "warning",
  high: "error",
};

export function GridRiskView({ output }: { output: M7Output }) {
  const maxExposure = Math.max(...output.gridRisks.map((r) => r.exposureScore), 1);

  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Typography variant="overline" color="text.secondary">
        Grid and reserve risk
      </Typography>
      <Stack spacing={2} sx={{ mt: 1.5 }}>
        {output.gridRisks.map((risk) => {
          const exposurePct = (risk.exposureScore / maxExposure) * 100;
          return (
            <Stack key={risk.id} spacing={0.75}>
              <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="center">
                <Typography variant="body2">{risk.title}</Typography>
                <Chip
                  size="small"
                  color={SEVERITY_COLOR[risk.severity]}
                  label={`Exposure ${risk.exposureScore.toFixed(2)}`}
                />
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.max(6, exposurePct)}
                color={SEVERITY_COLOR[risk.severity]}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary">
                {risk.probabilityPct.toFixed(1)}% probability · {risk.impactMW.toFixed(1)} MW impact · {risk.mitigation}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </Paper>
  );
}
