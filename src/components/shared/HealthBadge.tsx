"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

/**
 * Two-dot health badge — polls /api/health every 30s.
 */
interface HealthData {
  web: { status: "ok"; version: string; uptimeSec: number };
  agents: { status: "ok" | "degraded" | "down"; detail?: string; url?: string };
  timestamp: string;
}

const STATUS_COLOR: Record<string, string> = {
  ok: "#4ADE80",
  degraded: "#F4B740",
  down: "#EF6A6A",
  unknown: "#9AA7B5",
};

export function HealthBadge() {
  const [data, setData] = useState<HealthData | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (!res.ok) throw new Error(`${res.status}`);
        const json = (await res.json()) as HealthData;
        if (alive) setData(json);
      } catch {
        if (alive) {
          setData({
            web: { status: "ok", version: "1.0.0", uptimeSec: 0 },
            agents: { status: "down", detail: "health endpoint unreachable" },
            timestamp: new Date().toISOString(),
          });
        }
      }
    };
    load();
    const id = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const webColor = STATUS_COLOR[data?.web?.status ?? "unknown"];
  const agentColor = STATUS_COLOR[data?.agents?.status ?? "unknown"];

  return (
    <Stack direction="row" spacing={1.5} alignItems="center" aria-label="System health">
      <Tooltip title={`Web: ${data?.web?.status ?? "checking"}`} arrow>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: webColor }} aria-hidden />
          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 11 }}>
            web
          </Typography>
        </Stack>
      </Tooltip>
      <Tooltip title={`Agents: ${data?.agents?.status ?? "checking"}${data?.agents?.detail ? ` — ${data.agents.detail}` : ""}`} arrow>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: agentColor }} aria-hidden />
          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 11 }}>
            agents
          </Typography>
        </Stack>
      </Tooltip>
    </Stack>
  );
}
