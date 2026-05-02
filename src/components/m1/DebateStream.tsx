"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Alert from "@mui/material/Alert";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { callAgent, type AgentEvent } from "@/lib/shared/agent-client";
import type { M1Input, M1Output } from "@/lib/m1/types";

interface Props {
  input: M1Input;
  output: M1Output;
  presetId?: string;
  onSynthesis?: (s: SynthesisResult) => void;
}

export interface SynthesisResult {
  decision: string;
  confidence: number;
  dissents: string[];
  key_drivers: string[];
}

interface AgentAccumulator {
  agent: string;
  phase: string;
  text: string;
}

const AGENT_LABELS: Record<string, string> = {
  power_analyst: "Power Analyst",
  sovereignty_analyst: "Sovereignty Analyst",
  finance_analyst: "Finance Analyst",
  climate_analyst: "Climate Analyst",
  ic_synthesizer: "IC Synthesizer",
};

const AGENT_COLORS: Record<string, string> = {
  power_analyst: "#60A5FA",
  sovereignty_analyst: "#C9A66B",
  finance_analyst: "#4F7CAC",
  climate_analyst: "#4ADE80",
  ic_synthesizer: "#F4B740",
};

export function DebateStream({ input, output, presetId, onSynthesis }: Props) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<AgentAccumulator[]>([]);
  const [synthesis, setSynthesis] = useState<SynthesisResult | null>(null);

  const runDebate = async () => {
    setRunning(true);
    setError(null);
    setTurns([]);
    setSynthesis(null);

    const body = {
      question: `Where should DAMAC deploy ${input.targetMW} MW of ${input.workloadProfile} capacity in ${input.region}?`,
      input,
      scorecards: output.scorecards,
      preset_id: presetId,
    };

    try {
      for await (const evt of callAgent("site-debate", body)) {
        handleEvent(evt);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  const handleEvent = (evt: AgentEvent) => {
    if (evt.event === "phase") {
      const { agent, phase } = evt.data as { agent?: string; phase: string };
      if (agent) {
        setTurns((prev) => {
          // Start a new accumulator entry for this agent+phase if last one is different
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
        if (last && last.agent === agent) {
          next[next.length - 1] = { ...last, text: last.text + delta };
        } else {
          next.push({ agent, phase: "speaking", text: delta });
        }
        return next;
      });
    } else if (evt.event === "done") {
      const data = evt.data as SynthesisResult | { ok?: boolean; mock?: boolean };
      if ("decision" in data) {
        setSynthesis(data);
        onSynthesis?.(data);
      }
    } else if (evt.event === "error") {
      setError((evt.data as { message: string }).message);
    }
  };

  const uniqueAgents = useMemo(
    () => Array.from(new Set(turns.map((t) => t.agent))),
    [turns],
  );

  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">Agent debate</Typography>
          <Typography variant="body2" color="text.secondary">
            4 analysts (Sonnet) → IC synthesizer (Opus). Streamed via SSE.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PlayArrowIcon />}
          onClick={runDebate}
          disabled={running}
        >
          {running ? "Running…" : synthesis ? "Re-run debate" : "Run debate"}
        </Button>
      </Stack>

      {running && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {uniqueAgents.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", gap: 0.5 }}>
          {uniqueAgents.map((a) => (
            <Chip
              key={a}
              label={AGENT_LABELS[a] ?? a}
              size="small"
              sx={{ bgcolor: `${AGENT_COLORS[a] ?? "#999"}22`, color: AGENT_COLORS[a] ?? "#999" }}
            />
          ))}
        </Stack>
      )}

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
            <Typography
              variant="caption"
              sx={{ color: AGENT_COLORS[t.agent] ?? "text.secondary", fontWeight: 600, letterSpacing: "0.04em" }}
            >
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
