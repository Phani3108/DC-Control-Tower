"use client";

import { useState } from "react";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Alert from "@mui/material/Alert";
import EditNoteIcon from "@mui/icons-material/EditNote";
import { callAgent, type AgentEvent } from "@/lib/shared/agent-client";
import type { M2Output } from "@/lib/m2/types";

export interface ProposalSynthesis {
  decision: string;
  confidence: number;
  dissents: string[];
  key_drivers: string[];
}

interface Props {
  output: M2Output;
  presetId?: string;
  onSynthesis?: (s: ProposalSynthesis) => void;
}

export function ProposalStream({ output, presetId, onSynthesis }: Props) {
  const [tokens, setTokens] = useState<string>("");
  const [synthesis, setSynthesis] = useState<ProposalSynthesis | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setRunning(true);
    setError(null);
    setTokens("");
    setSynthesis(null);
    const primary = output.fits.find((f) => f.facilityId === output.primaryFacilityId);
    const body = {
      workload: output.input.workload,
      fits: output.fits,
      primaryCost: primary ? output.costs[primary.facilityId] : null,
      sla: output.sla,
      comparisons: output.comparisons,
      preset_id: presetId,
    };
    try {
      for await (const evt of callAgent("proposal-draft", body)) {
        handle(evt);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  const handle = (evt: AgentEvent) => {
    if (evt.event === "token") {
      const { delta } = evt.data as { delta: string };
      setTokens((prev) => prev + delta);
    } else if (evt.event === "done") {
      const data = evt.data as ProposalSynthesis | { ok?: boolean };
      if ("decision" in data) {
        setSynthesis(data);
        onSynthesis?.(data);
      }
    } else if (evt.event === "error") {
      setError((evt.data as { message: string }).message);
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">Proposal writer</Typography>
          <Typography variant="body2" color="text.secondary">
            Opus 4.6 synthesizes facility fits + cost + SLA + benchmarks into a customer-ready narrative.
          </Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<EditNoteIcon />} onClick={run} disabled={running}>
          {running ? "Writing…" : synthesis ? "Re-run" : "Draft proposal"}
        </Button>
      </Stack>

      {running && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {tokens && !synthesis && (
        <Box
          sx={{
            p: 2,
            mb: 2,
            bgcolor: "rgba(255,255,255,0.02)",
            borderRadius: 1,
            fontFamily: '"SF Mono", Menlo, monospace',
            fontSize: 12,
            whiteSpace: "pre-wrap",
            maxHeight: 280,
            overflowY: "auto",
          }}
        >
          {tokens}
        </Box>
      )}

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
            Proposal · confidence {(synthesis.confidence * 100).toFixed(0)}%
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
              <Typography variant="caption" color="text.secondary">CAVEATS</Typography>
              <ul style={{ margin: "4px 0 0 18px", padding: 0 }}>
                {synthesis.dissents.map((d) => (
                  <li key={d}><Typography variant="body2">{d}</Typography></li>
                ))}
              </ul>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
}
