"use client";

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import type { M4Output } from "@/lib/m4/types";

const VERDICT_COLORS: Record<string, { bg: string; fg: string }> = {
  clear: { bg: "rgba(74,222,128,0.15)", fg: "#4ADE80" },
  gated: { bg: "rgba(244,183,64,0.15)", fg: "#F4B740" },
  blocked: { bg: "rgba(239,106,106,0.15)", fg: "#EF6A6A" },
};

interface Props {
  output: M4Output;
}

export function AssessmentGrid({ output }: Props) {
  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Typography variant="overline" color="text.secondary">Per-jurisdiction assessment</Typography>
      <Stack spacing={1.5} sx={{ mt: 1.5 }}>
        {output.assessments.map((a) => {
          const v = VERDICT_COLORS[a.verdict] ?? VERDICT_COLORS.clear;
          return (
            <Box
              key={a.jurisdiction}
              sx={{
                p: 1.5,
                borderRadius: 1,
                borderLeft: `3px solid ${v.fg}`,
                bgcolor: "rgba(255,255,255,0.02)",
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {a.jurisdiction} · {a.country}
                </Typography>
                <Chip
                  label={a.verdict.toUpperCase()}
                  size="small"
                  sx={{ bgcolor: v.bg, color: v.fg, fontWeight: 700, letterSpacing: "0.04em" }}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {a.notes}
              </Typography>
              {(a.blockingCiteIds.length > 0 || a.gatingCiteIds.length > 0) && (
                <Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: "wrap", gap: 0.5 }}>
                  {a.blockingCiteIds.map((id) => (
                    <Chip key={id} label={id} size="small" color="error" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
                  ))}
                  {a.gatingCiteIds.map((id) => (
                    <Chip key={id} label={id} size="small" color="warning" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
                  ))}
                </Stack>
              )}
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}
