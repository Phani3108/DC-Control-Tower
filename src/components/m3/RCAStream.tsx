"use client";

import { useState } from "react";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Alert from "@mui/material/Alert";
import BoltIcon from "@mui/icons-material/Bolt";
import { callAgent, type AgentEvent } from "@/lib/shared/agent-client";
import type { M3Output } from "@/lib/m3/types";

interface RCASynthesis {
  decision: string;
  confidence: number;
  dissents: string[];
  key_drivers: string[];
}

const AGENT_COLORS: Record<string, string> = {
  ops_agent: "#60A5FA",
  infra_agent: "#4F7CAC",
  risk_agent: "#F4B740",
  rca_synthesizer: "#C9A66B",
};

const AGENT_LABELS: Record<string, string> = {
  ops_agent: "Ops Agent",
  infra_agent: "Infra Agent",
  risk_agent: "Risk Agent",
  rca_synthesizer: "RCA Synthesizer",
};

interface Turn { agent: string; phase: string; text: string }

export function RCAStream({ output, presetId }: { output: M3Output; presetId?: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [synthesis, setSynthesis] = useState<RCASynthesis | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = (evt: AgentEvent) => {
    if (evt.event === "phase") {
      const { agent, phase } = evt.data as { agent?: string; phase: string };
      if (agent) {
        setTurns((prev) => {
          if (prev.length && prev[prev.length - 1].agent === agent && prev[prev.length - 1].phase === phase) return prev;
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
      const data = evt.data as RCASynthesis | { ok?: boolean };
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
    const body = {
      series: output.series,
      anomalies: output.anomalies,
      failureRisks: output.failureRisks,
      preset_id: presetId,
    };
    try {
      for await (const evt of callAgent("rca", body)) handle(evt);
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
          <Typography variant="overline" color="text.secondary">RCA debate</Typography>
          <Typography variant="body2" color="text.secondary">
            Ops + Infra + Risk agents (Sonnet) → RCA Synthesizer (Opus).
          </Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<BoltIcon />} onClick={run} disabled={running}>
          {running ? "Running…" : synthesis ? "Re-run RCA" : "Run RCA"}
        </Button>
      </Stack>

      {running && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
              RCA · confidence {(synthesis.confidence * 100).toFixed(0)}%
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>{synthesis.decision}</Typography>
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
                <ul style={{ margin: "4px 0 0 18px", padding: 0 }}>
                  {synthesis.dissents.map((d) => (
                    <li key={d}><Typography variant="body2">{d}</Typography></li>
                  ))}
                </ul>
              </Box>
            )}
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
