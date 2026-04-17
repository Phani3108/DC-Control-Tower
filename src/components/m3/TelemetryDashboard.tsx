"use client";

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TelemetrySeries } from "@/lib/m3/types";

interface Props {
  series: TelemetrySeries;
}

function formatT(t: string) {
  return new Date(t).toISOString().slice(11, 16);
}

const CHART_HEIGHT = 160;

const METRICS: Array<{
  key: keyof TelemetrySeries["points"][number];
  label: string;
  color: string;
  unit: string;
}> = [
  { key: "powerKW", label: "Power", color: "#C9A66B", unit: "kW" },
  { key: "outletTempC", label: "Outlet temp", color: "#EF6A6A", unit: "°C" },
  { key: "latencyP99Ms", label: "p99 latency", color: "#60A5FA", unit: "ms" },
  { key: "pduLoadPct", label: "PDU load", color: "#F4B740", unit: "%" },
];

export function TelemetryDashboard({ series }: Props) {
  // down-sample to max ~200 points for chart perf
  const data = series.points
    .filter((_, i) => series.points.length <= 200 || i % Math.ceil(series.points.length / 200) === 0)
    .map((p) => ({ ...p, t: formatT(p.t) }));

  const incidentT = formatT(series.annotations[0]?.t ?? series.startTime);

  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">Live telemetry</Typography>
          <Typography variant="h6">
            {series.zone} · {series.facility}
          </Typography>
        </Box>
        <Chip
          label={`Incident ${series.incidentId}`}
          color="warning"
          variant="outlined"
          size="small"
          sx={{ fontWeight: 600 }}
        />
      </Stack>

      <Grid container spacing={2}>
        {METRICS.map((m) => (
          <Grid size={{ xs: 12, sm: 6 }} key={m.key as string}>
            <Typography variant="caption" color="text.secondary">
              {m.label} ({m.unit})
            </Typography>
            <Box sx={{ width: "100%", height: CHART_HEIGHT }}>
              <ResponsiveContainer>
                <LineChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 6 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="t" tick={{ fill: "#9AA7B5", fontSize: 10 }} minTickGap={30} />
                  <YAxis tick={{ fill: "#9AA7B5", fontSize: 10 }} width={40} />
                  <Tooltip
                    contentStyle={{ background: "#141A23", border: "1px solid #2A3340", borderRadius: 8 }}
                    labelStyle={{ color: "#E8EEF5" }}
                  />
                  <Line
                    type="monotone"
                    dataKey={m.key as string}
                    stroke={m.color}
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <ReferenceLine x={incidentT} stroke="#EF6A6A" strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}
