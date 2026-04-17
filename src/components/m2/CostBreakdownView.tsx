"use client";

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CostBreakdown } from "@/lib/m2/types";

const LAYER_COLOR: Record<string, string> = {
  power: "#C9A66B",
  cooling: "#60A5FA",
  "gpu-amortization": "#F4B740",
  "real-estate": "#4ADE80",
  network: "#4F7CAC",
  "staff-ops": "#EF6A6A",
};

interface Props {
  facilityName: string;
  cost: CostBreakdown;
}

export function CostBreakdownView({ facilityName, cost }: Props) {
  const data = cost.layers.map((l) => ({
    layer: l.layer,
    usd: l.usdPerMonth,
    pct: Math.round((l.usdPerMonth / cost.totalUSDPerMonth) * 100),
  }));

  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Stack direction="row" alignItems="baseline" spacing={2} sx={{ mb: 2 }}>
        <Typography variant="overline" color="text.secondary">Cost breakdown · {facilityName}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          ${cost.totalUSDPerMWh.toFixed(1)} / MWh blended
        </Typography>
        <Typography variant="body2" color="text.secondary">
          3-yr TCO ${cost.threeYearUSDm}M
        </Typography>
      </Stack>

      <Box sx={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 40, right: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis type="number" tick={{ fill: "#9AA7B5", fontSize: 12 }} />
            <YAxis dataKey="layer" type="category" tick={{ fill: "#9AA7B5", fontSize: 12 }} width={110} />
            <Tooltip
              formatter={(value) => [`$${(value as number).toLocaleString()}`, "USD / month"] as [string, string]}
              contentStyle={{ background: "#141A23", border: "1px solid #2A3340", borderRadius: 8 }}
              labelStyle={{ color: "#E8EEF5" }}
            />
            <Bar dataKey="usd" radius={[0, 4, 4, 0]}>
              {data.map((d) => (
                <Cell key={d.layer} fill={LAYER_COLOR[d.layer] ?? "#999"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>

      <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}>
        {data.map((d) => (
          <Box key={d.layer} sx={{ p: 1, minWidth: 110, borderLeft: `3px solid ${LAYER_COLOR[d.layer] ?? "#999"}`, pl: 1.5 }}>
            <Typography variant="caption" color="text.secondary">{d.layer}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              ${(d.usd / 1000).toFixed(0)}k · {d.pct}%
            </Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
