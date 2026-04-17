"use client";

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import type { M2Output } from "@/lib/m2/types";

const FACTOR_LABELS: Record<string, string> = {
  powerFit: "Power",
  rackDensityFit: "Density",
  latencyFit: "Latency",
  coolingFit: "Cooling",
  sustainabilityFit: "Sustain.",
  budgetFit: "Budget",
};

export function FacilityFitView({ output }: { output: M2Output }) {
  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Typography variant="overline" color="text.secondary">Ranked facility fit</Typography>
      <Stack spacing={2} sx={{ mt: 1.5 }}>
        {output.fits.slice(0, 5).map((f, i) => {
          const isPrimary = f.facilityId === output.primaryFacilityId;
          return (
            <Box
              key={f.facilityId}
              sx={{
                p: 2,
                borderRadius: 1,
                border: "1px solid",
                borderColor: isPrimary ? "primary.main" : "rgba(255,255,255,0.08)",
                bgcolor: isPrimary ? "rgba(201,166,107,0.04)" : "transparent",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    bgcolor: i === 0 ? "primary.main" : "rgba(255,255,255,0.08)",
                    color: i === 0 ? "background.default" : "text.primary",
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {i + 1}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {f.facilityName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {f.country} · {f.rackCount} racks @ {f.kWPerRack} kW/rack · {f.coolingMode}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="h6">{f.fitScore.toFixed(1)}</Typography>
                  <Typography variant="caption" color="text.secondary">fit</Typography>
                </Box>
              </Stack>

              {/* Factor bars */}
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                {Object.entries(f.factors).map(([k, v]) => (
                  <Box key={k} sx={{ flex: "1 1 90px", minWidth: 90 }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        {FACTOR_LABELS[k] ?? k}
                      </Typography>
                      <Typography variant="caption">{v}</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={v}
                      sx={{
                        height: 3,
                        borderRadius: 1,
                        bgcolor: "rgba(255,255,255,0.06)",
                        "& .MuiLinearProgress-bar": {
                          bgcolor: v >= 70 ? "#4ADE80" : v >= 50 ? "#F4B740" : "#EF6A6A",
                        },
                      }}
                    />
                  </Box>
                ))}
              </Stack>

              {f.blockers.length > 0 && (
                <Stack direction="row" spacing={0.5} sx={{ mt: 1.5, flexWrap: "wrap", gap: 0.5 }}>
                  {f.blockers.map((b) => (
                    <Chip key={b} size="small" color="warning" variant="outlined" label={b} sx={{ height: 18, fontSize: 10 }} />
                  ))}
                </Stack>
              )}

              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                {f.recommendedPhasing}
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}
