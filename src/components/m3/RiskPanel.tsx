"use client";

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import type { FailureRisk } from "@/lib/m3/types";

export function RiskPanel({ risks }: { risks: FailureRisk[] }) {
  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Typography variant="overline" color="text.secondary">6-hour failure forecast</Typography>
      {risks.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          No elevated risks detected.
        </Typography>
      ) : (
        <Stack spacing={2} sx={{ mt: 1.5 }}>
          {risks.map((r) => {
            const color = r.probabilityPct >= 50 ? "#EF6A6A" : r.probabilityPct >= 25 ? "#F4B740" : "#60A5FA";
            return (
              <Box key={r.component}>
                <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.component}</Typography>
                  <Typography variant="body2" sx={{ color, fontWeight: 700 }}>
                    {r.probabilityPct}% · {r.horizonHours}h
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={r.probabilityPct}
                  sx={{
                    height: 4,
                    borderRadius: 1,
                    mt: 0.5,
                    bgcolor: "rgba(255,255,255,0.06)",
                    "& .MuiLinearProgress-bar": { bgcolor: color },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  {r.drivers.join(" · ")}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
}
