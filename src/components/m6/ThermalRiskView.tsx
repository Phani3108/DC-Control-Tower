"use client";

import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import type { M6Output } from "@/lib/m6/types";

const SEVERITY_COLOR: Record<string, "success" | "warning" | "error"> = {
  low: "success",
  medium: "warning",
  high: "error",
};

export function ThermalRiskView({ output }: { output: M6Output }) {
  const maxExposure = Math.max(...output.hotspotRisks.map((r) => r.exposureScore), 1);

  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Typography variant="overline" color="text.secondary">
        Thermal hotspot risk
      </Typography>
      <Stack spacing={2} sx={{ mt: 1.5 }}>
        {output.hotspotRisks.map((risk) => {
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
                {risk.probabilityPct.toFixed(1)}% probability · {risk.impactTempC.toFixed(1)}°C impact · {risk.mitigation}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </Paper>
  );
}
