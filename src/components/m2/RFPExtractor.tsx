"use client";

import { useState } from "react";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import type { M2Workload } from "@/lib/m2/types";

interface Props {
  initialText?: string;
  onExtracted: (workload: M2Workload) => void;
}

export function RFPExtractor({ initialText = "", onExtracted }: Props) {
  const [text, setText] = useState(initialText);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<M2Workload | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/rfp-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfpText: text }),
      });
      if (!res.ok) throw new Error(`extract failed: ${res.status}`);
      const json = (await res.json()) as { workload: M2Workload };
      setLast(json.workload);
      onExtracted(json.workload);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="overline" color="text.secondary">RFP text</Typography>
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<AutoAwesomeIcon />}
          onClick={run}
          disabled={busy || !text.trim()}
        >
          {busy ? "Extracting…" : "Extract with Sonnet"}
        </Button>
      </Stack>
      <TextField
        multiline
        minRows={6}
        maxRows={14}
        fullWidth
        placeholder="Paste the customer RFP here. Sonnet will extract the structured workload requirements (GPU SKU, cluster MW, latency SLA, data residency, budget, sustainability)…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        sx={{ "& textarea": { fontFamily: '"SF Mono", Menlo, monospace', fontSize: 12.5 } }}
      />
      {busy && <LinearProgress sx={{ mt: 2 }} />}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {last && (
        <Stack direction="row" spacing={0.5} sx={{ mt: 2, flexWrap: "wrap", gap: 0.5 }}>
          <Chip size="small" label={`shape: ${last.shape}`} />
          <Chip size="small" label={`gpu: ${last.gpu}`} />
          <Chip size="small" label={`${last.clusterMW} MW`} />
          {last.latencySLAms && <Chip size="small" label={`≤${last.latencySLAms}ms`} />}
          {last.budgetUSDPerMWhMax && <Chip size="small" label={`≤$${last.budgetUSDPerMWhMax}/MWh`} />}
          {last.sustainability?.pueMax && <Chip size="small" label={`PUE≤${last.sustainability.pueMax}`} />}
          {last.customerGeography && <Chip size="small" label={`customer=${last.customerGeography}`} />}
          {last.dataGeography && <Chip size="small" label={`data=${last.dataGeography}`} />}
        </Stack>
      )}
    </Paper>
  );
}
