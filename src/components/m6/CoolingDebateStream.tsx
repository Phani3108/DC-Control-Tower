"use client";

import { useState } from "react";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Alert from "@mui/material/Alert";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { callAgent, type AgentEvent } from "@/lib/shared/agent-client";
import type { M6Output } from "@/lib/m6/types";

interface CoolingSynthesis {
  decision: string;
  confidence: number;
  dissents: string[];
  key_drivers: string[];
}

interface Turn {
  agent: string;
  phase: string;
  text: string;
}

const AGENT_COLORS: Record<string, string> = {
  hvac_analyst: "#5CC7B2",
  thermal_modeling_analyst: "#60A5FA",
  cooling_finops_analyst: "#F4B740",
  cooling_synthesizer: "#C9A66B",
};

const AGENT_LABELS: Record<string, string> = {
  hvac_analyst: "HVAC Analyst",
  thermal_modeling_analyst: "Thermal Modeling Analyst",
  cooling_finops_analyst: "Cooling FinOps Analyst",
  cooling_synthesizer: "Cooling Synthesizer",
};

export function CoolingDebateStream({ output, presetId }: { output: M6Output; presetId?: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [synthesis, setSynthesis] = useState<CoolingSynthesis | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = (evt: AgentEvent) => {
    if (evt.event === "phase") {
      const { agent, phase } = evt.data as { agent?: string; phase: string };
      if (agent) {
        setTurns((prev) => {
          if (prev.length && prev[prev.length - 1].agent === agent && prev[prev.length - 1].phase === phase) {
            return prev;
          }
          return [...prev, { agent, phase, text: "" }];
        });
      }
    } else if (evt.event === "token") {
      const { agent, delta } = evt.data as { agent: string; delta: string };
      setTurns((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.agent === agent) next[next.length - 1] = { ...last, text: last.text + delta };
        else next.push({ agent, phase: "speaking", text: delta });
        return next;
      });
    } else if (evt.event === "done") {
      const data = evt.data as CoolingSynthesis | { ok?: boolean };
      if ("decision" in data) setSynthesis(data);
    } else if (evt.event === "error") {
      setError((evt.data as { message: string }).message);
    }
  };

  const run = async () => {
    setRunning(true);
    setError(null);
    setTurns([]);
    setSynthesis(null);

    try {
      for await (const evt of callAgent("cooling-optimize", {
        input: output.input,
        currentPUE: output.currentPUE,
        optimizedPUEP50: output.optimizedPUEP50,
        optimizedPUEP90: output.optimizedPUEP90,
        coolingEnergySavingsPct: output.coolingEnergySavingsPct,
        annualSavingsUSDm: output.annualSavingsUSDm,
        setpointPlan: output.setpointPlan,
        hotspotRisks: output.hotspotRisks,
        preset_id: presetId,
      })) {
        handle(evt);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Cooling optimization debate
          </Typography>
          <Typography variant="body2" color="text.secondary">
            HVAC + Thermal + FinOps analysts (Sonnet) → Cooling Synthesizer (Opus).
          </Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<PlayArrowIcon />} onClick={run} disabled={running}>
          {running ? "Running…" : synthesis ? "Re-run debate" : "Run debate"}
        </Button>
      </Stack>

      {running && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack direction="row" spacing={0.75} sx={{ mb: 2, flexWrap: "wrap", gap: 0.5 }}>
        {Object.entries(AGENT_LABELS).map(([key, label]) => (
          <Chip
            key={key}
            label={label}
            size="small"
            sx={{ bgcolor: `${AGENT_COLORS[key]}22`, color: AGENT_COLORS[key] }}
          />
        ))}
      </Stack>

      <Stack spacing={2} sx={{ maxHeight: 420, overflowY: "auto", pr: 1 }}>
        {turns.map((t, i) => (
          <Box
            key={i}
            sx={{
              p: 1.5,
              borderRadius: 1,
              borderLeft: "3px solid",
              borderColor: AGENT_COLORS[t.agent] ?? "#555",
              bgcolor: "rgba(255,255,255,0.02)",
            }}
          >
            <Typography variant="caption" sx={{ color: AGENT_COLORS[t.agent] ?? "text.secondary", fontWeight: 600 }}>
              {AGENT_LABELS[t.agent] ?? t.agent} · {t.phase}
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}>
              {t.text || <em style={{ color: "#5A6472" }}>thinking…</em>}
            </Typography>
          </Box>
        ))}

        {synthesis && (
          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              border: "1px solid",
              borderColor: "primary.main",
              bgcolor: "rgba(201,166,107,0.06)",
            }}
          >
            <Typography variant="overline" color="primary.light">
              Synthesis · confidence {(synthesis.confidence * 100).toFixed(0)}%
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
              {synthesis.decision}
            </Typography>

            {synthesis.key_drivers?.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">KEY DRIVERS</Typography>
                <ul style={{ margin: "4px 0 0 18px", padding: 0 }}>
                  {synthesis.key_drivers.map((d) => (
                    <li key={d}><Typography variant="body2">{d}</Typography></li>
                  ))}
                </ul>
              </Box>
            )}

            {synthesis.dissents?.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">DISSENTS</Typography>
                <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: "wrap", gap: 0.5 }}>
                  {synthesis.dissents.map((d) => (
                    <Chip key={d} label={d} size="small" variant="outlined" />
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
