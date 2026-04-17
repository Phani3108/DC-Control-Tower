"use client";

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import type { SimulationOutput } from "@/lib/m3/types";

const LABELS: Record<string, string> = {
  "load-plus-30": "+30% load ramp",
  "cooling-drop": "Cooling drop / CRAC failure",
  "network-brownout": "Network brownout",
};

export function SimulationPanel({ simulations }: { simulations: SimulationOutput[] }) {
  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Typography variant="overline" color="text.secondary">Simulation mode</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Pre-computed what-if scenarios. Projects peak latency, peak temperature, trip risk, and mitigation sequences from the current telemetry baseline.
      </Typography>

      <Grid container spacing={2}>
        {simulations.map((sim) => (
          <Grid size={{ xs: 12, md: 4 }} key={sim.scenario}>
            <Box
              sx={{
                p: 2,
                height: "100%",
                borderRadius: 1,
                border: "1px solid rgba(255,255,255,0.08)",
                bgcolor: "rgba(255,255,255,0.02)",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                {LABELS[sim.scenario] ?? sim.scenario}
              </Typography>

              <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">peak p99</Typography>
                  <Typography variant="h6" sx={{ color: "#EF6A6A" }}>{sim.projectedPeakLatencyMs} ms</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">peak temp</Typography>
                  <Typography variant="h6" sx={{ color: "#F4B740" }}>{sim.projectedPeakTempC} °C</Typography>
                </Box>
              </Stack>

              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>Trip risk</Typography>
              <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                {sim.tripRiskComponents.map((c) => (
                  <Chip key={c} label={c} size="small" color="error" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                ))}
              </Stack>

              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>Mitigations</Typography>
              <ul style={{ margin: "4px 0 0 18px", padding: 0 }}>
                {sim.mitigations.map((m) => (
                  <li key={m} style={{ fontSize: 12 }}>{m}</li>
                ))}
              </ul>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}
