"use client";

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import type { M3Output } from "@/lib/m3/types";

const SEVERITY_COLOR: Record<string, string> = {
  info: "#60A5FA",
  warn: "#F4B740",
  critical: "#EF6A6A",
  low: "#9AA7B5",
  medium: "#F4B740",
  high: "#EF6A6A",
};

export function IncidentTimeline({ output }: { output: M3Output }) {
  const merged = [
    ...output.series.annotations.map((a) => ({
      t: a.t,
      kind: "annotation" as const,
      label: a.note,
      severity: a.severity,
    })),
    ...output.anomalies.slice(0, 15).map((a) => ({
      t: a.t,
      kind: "anomaly" as const,
      label: `${a.metric} = ${a.value} (z=${a.zscore})`,
      severity: a.severity,
    })),
  ].sort((a, b) => a.t.localeCompare(b.t));

  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Typography variant="overline" color="text.secondary">Timeline</Typography>
      <Stack spacing={1} sx={{ mt: 1.5, maxHeight: 260, overflowY: "auto", pr: 1 }}>
        {merged.map((item, i) => {
          const color = SEVERITY_COLOR[item.severity] ?? "#9AA7B5";
          return (
            <Stack key={i} direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: color,
                  flexShrink: 0,
                }}
              />
              <Typography variant="caption" sx={{ minWidth: 56, color: "text.secondary", fontFamily: "monospace" }}>
                {new Date(item.t).toISOString().slice(11, 16)}
              </Typography>
              <Chip
                label={item.kind}
                size="small"
                variant="outlined"
                sx={{ height: 18, fontSize: 10, borderColor: `${color}55`, color }}
              />
              <Typography variant="body2" sx={{ flex: 1 }}>
                {item.label}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </Paper>
  );
}
