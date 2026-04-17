"use client";

import { useState } from "react";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import SendIcon from "@mui/icons-material/Send";
import Alert from "@mui/material/Alert";
import { callAgent } from "@/lib/shared/agent-client";
import type { M3Output } from "@/lib/m3/types";

interface Msg { role: "user" | "assistant"; text: string }

const SUGGESTIONS = [
  "What's at risk in the next 6 hours?",
  "Why did latency spike at 04:17?",
  "Which racks should we migrate preemptively?",
  "What's the SLA credit exposure if this continues?",
];

export function NLQueryChat({ output }: { output: M3Output }) {
  const [question, setQuestion] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (q: string) => {
    const query = q.trim();
    if (!query) return;
    setQuestion("");
    setError(null);
    setMsgs((prev) => [...prev, { role: "user", text: query }, { role: "assistant", text: "" }]);
    setRunning(true);
    try {
      for await (const evt of callAgent("nl-query", {
        question: query,
        series: output.series,
        anomalies: output.anomalies,
        failureRisks: output.failureRisks,
        simulations: output.simulations,
      })) {
        if (evt.event === "token") {
          const { delta } = evt.data as { delta: string };
          setMsgs((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            next[next.length - 1] = { ...last, text: last.text + delta };
            return next;
          });
        } else if (evt.event === "error") {
          setError((evt.data as { message: string }).message);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Typography variant="overline" color="text.secondary">Natural-language ops</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Ask anything about the current telemetry. Opus 4.6, grounded on the JSON snapshot.
      </Typography>

      {msgs.length === 0 && (
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
          {SUGGESTIONS.map((s) => (
            <Button key={s} size="small" variant="outlined" onClick={() => send(s)}>{s}</Button>
          ))}
        </Stack>
      )}

      <Stack spacing={1.5} sx={{ mb: 2, maxHeight: 360, overflowY: "auto" }}>
        {msgs.map((m, i) => (
          <Box
            key={i}
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: m.role === "user" ? "rgba(96,165,250,0.08)" : "rgba(255,255,255,0.02)",
              borderLeft: `3px solid ${m.role === "user" ? "#60A5FA" : "#C9A66B"}`,
            }}
          >
            <Typography variant="caption" sx={{ color: m.role === "user" ? "#60A5FA" : "primary.light", fontWeight: 600 }}>
              {m.role === "user" ? "YOU" : "NL AGENT"}
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}>
              {m.text || <em style={{ color: "#5A6472" }}>thinking…</em>}
            </Typography>
          </Box>
        ))}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          fullWidth
          placeholder="Ask the control tower…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(question);
            }
          }}
          disabled={running}
        />
        <Button variant="contained" color="primary" onClick={() => send(question)} disabled={running || !question.trim()} endIcon={<SendIcon />}>
          Ask
        </Button>
      </Stack>
    </Paper>
  );
}
