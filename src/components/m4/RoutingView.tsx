"use client";

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import type { M4Output } from "@/lib/m4/types";

const VERDICT_COLORS: Record<string, string> = {
  clear: "#4ADE80",
  gated: "#F4B740",
  blocked: "#EF6A6A",
};

export function RoutingView({ output }: { output: M4Output }) {
  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Typography variant="overline" color="text.secondary">Facility routing</Typography>
      <Stack spacing={1.5} sx={{ mt: 1.5 }}>
        {output.routing.map((r, i) => {
          const color = VERDICT_COLORS[r.verdict] ?? "#999";
          const isPrimary = r.facilityId === output.primaryFacility;
          return (
            <Box
              key={r.facilityId}
              sx={{
                p: 1.5,
                borderRadius: 1,
                border: "1px solid",
                borderColor: isPrimary ? "primary.main" : "rgba(255,255,255,0.08)",
                bgcolor: isPrimary ? "rgba(201,166,107,0.05)" : "transparent",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    bgcolor: color,
                    color: "background.default",
                    fontSize: 12,
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {i + 1}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                    {r.facilityName}
                    {isPrimary && (
                      <Chip label="PRIMARY" size="small" sx={{ ml: 1, bgcolor: "primary.main", color: "background.default", height: 18, fontSize: 10, fontWeight: 700 }} />
                    )}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{r.country}</Typography>
                </Box>
                <Chip
                  label={r.verdict.toUpperCase()}
                  size="small"
                  sx={{ bgcolor: `${color}22`, color, fontWeight: 700 }}
                />
              </Stack>
              <LinearProgress
                variant="determinate"
                value={r.fitScore}
                sx={{
                  height: 3,
                  mt: 1,
                  borderRadius: 1,
                  bgcolor: "rgba(255,255,255,0.06)",
                  "& .MuiLinearProgress-bar": { bgcolor: color },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                {r.rationale}
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}
