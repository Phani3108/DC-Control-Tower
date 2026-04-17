"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { SiteScorecard } from "@/lib/m1/types";

const LABELS: Record<string, string> = {
  powerAvailability: "Power",
  powerCost: "Cost",
  cooling: "Cooling",
  latency: "Latency",
  sovereignty: "Sovereignty",
  seismicClimate: "Seismic",
  incentives: "Incentives",
  talent: "Talent",
  financeRisk: "Finance",
  hyperscalerProximity: "Hyperscaler",
};

interface Props {
  card: SiteScorecard | null;
}

export function ScorecardRadar({ card }: Props) {
  if (!card) {
    return (
      <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
        <Typography color="text.secondary">Select a site to see its scorecard.</Typography>
      </Paper>
    );
  }

  const data = Object.entries(card.engineResults).map(([id, r]) => ({
    engine: LABELS[id] ?? id,
    score: r.score,
  }));

  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Stack direction="row" alignItems="baseline" spacing={2} sx={{ mb: 1 }}>
        <Typography variant="h5">{card.site.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          Rank #{card.rank} · {card.overallScore.toFixed(1)}/100 · 5-yr TCO ${card.tco5yrUSDm}M
        </Typography>
      </Stack>

      <Box sx={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <RadarChart data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="engine" tick={{ fill: "#9AA7B5", fontSize: 12 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#5A6472", fontSize: 10 }} />
            <Radar
              name={card.site.name}
              dataKey="score"
              stroke="#C9A66B"
              fill="#C9A66B"
              fillOpacity={0.3}
            />
            <Tooltip
              contentStyle={{ background: "#141A23", border: "1px solid #2A3340", borderRadius: 8 }}
              labelStyle={{ color: "#E8EEF5" }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </Box>

      <Stack direction="row" spacing={0.5} sx={{ mt: 2, flexWrap: "wrap", gap: 0.5 }}>
        {Object.entries(card.engineResults).map(([id, r]) => (
          <Chip
            key={id}
            label={`${LABELS[id] ?? id}: ${r.score}`}
            size="small"
            sx={{
              bgcolor: r.score >= 70 ? "rgba(74,222,128,0.15)" : r.score >= 50 ? "rgba(244,183,64,0.15)" : "rgba(239,106,106,0.15)",
              color: "text.primary",
            }}
          />
        ))}
      </Stack>
    </Paper>
  );
}
