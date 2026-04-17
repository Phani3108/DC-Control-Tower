"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { M1Output } from "@/lib/m1/types";

interface Props {
  output: M1Output;
}

export function TCOChart({ output }: Props) {
  const data = output.scorecards.map((c) => ({
    name: c.site.name.split(" ")[0],
    tco: c.tco5yrUSDm,
    rank: c.rank,
  }));

  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Typography variant="overline" color="text.secondary">5-year TCO by site ($M)</Typography>
      <Box sx={{ width: "100%", height: 220, mt: 1 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: "#9AA7B5", fontSize: 12 }} />
            <YAxis tick={{ fill: "#9AA7B5", fontSize: 12 }} />
            <Tooltip
              formatter={(value) => [`$${value}M`, "5-yr TCO"] as [string, string]}
              contentStyle={{ background: "#141A23", border: "1px solid #2A3340", borderRadius: 8 }}
              labelStyle={{ color: "#E8EEF5" }}
            />
            <Bar dataKey="tco" radius={[4, 4, 0, 0]}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.rank === 1 ? "#C9A66B" : d.rank === 2 ? "#4F7CAC" : "#2A3340"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
