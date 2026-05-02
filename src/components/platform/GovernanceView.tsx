"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import Collapse from "@mui/material/Collapse";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import CircularProgress from "@mui/material/CircularProgress";
import LaunchIcon from "@mui/icons-material/Launch";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

interface GovernanceRun {
  presetId: string;
  module: string;
  status: "success" | "partial" | "not-run";
  frameCount: number;
  tokenCount: number;
  confidence?: number;
  updatedAt: string;
  launchUrl: string;
  hitl: {
    state: "pending" | "approved" | "sent-back";
    reviewer?: { name: string; role: string; reviewerId?: string };
    reviewUpdatedAt?: string;
    comment?: string;
    history: Array<{
      action: "approve" | "send-back" | "reset";
      state: "pending" | "approved" | "sent-back";
      at: string;
      reviewer: { name: string; role: string; reviewerId?: string };
      comment?: string;
    }>;
  };
}

interface GovernancePayload {
  generatedAt: string;
  totals: {
    totalRuns: number;
    successfulRuns: number;
    avgConfidence: number;
    modulesCovered: number;
    totalModules: number;
    approvedCount: number;
    sentBackCount: number;
  };
  runs: GovernanceRun[];
  controls: Array<{ id: string; name: string; state: string; note: string }>;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Paper elevation={0} sx={{ p: 2, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h5" sx={{ mt: 0.5 }}>{value}</Typography>
    </Paper>
  );
}

function statusColor(status: GovernanceRun["status"]): "success" | "warning" | "default" {
  if (status === "success") return "success";
  if (status === "partial") return "warning";
  return "default";
}

function hitlColor(state: GovernanceRun["hitl"]["state"]): "success" | "warning" | "default" {
  if (state === "approved") return "success";
  if (state === "sent-back") return "warning";
  return "default";
}

export function GovernanceView() {
  const [data, setData] = useState<GovernancePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewerName, setReviewerName] = useState("Interview Panel");
  const [reviewerRole, setReviewerRole] = useState("Program Director");
  const [reviewerId, setReviewerId] = useState("panel-01");
  const [reviewComment, setReviewComment] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [postingPresetId, setPostingPresetId] = useState<string | null>(null);
  const [expandedHistoryByPreset, setExpandedHistoryByPreset] = useState<Record<string, boolean>>({});

  const loadGovernance = async () => {
    try {
      const res = await fetch("/api/data/governance", { cache: "no-store" });
      const json = (await res.json()) as GovernancePayload;
      setData(json);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/data/governance", { cache: "no-store" });
        const json = (await res.json()) as GovernancePayload;
        if (!cancelled) setData(json);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const submitHITLAction = async (presetId: string, action: "approve" | "send-back" | "reset") => {
    if (!reviewerName.trim() || !reviewerRole.trim()) {
      setActionError("Reviewer name and role are required before taking HITL actions.");
      return;
    }

    setActionError(null);
    setPostingPresetId(presetId);
    try {
      const res = await fetch("/api/data/governance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presetId,
          action,
          reviewer: {
            name: reviewerName.trim(),
            role: reviewerRole.trim(),
            reviewerId: reviewerId.trim() || undefined,
          },
          comment: reviewComment.trim() || undefined,
        }),
      });

      const json = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !json.ok) {
        throw new Error(json.message ?? "Failed to persist governance action");
      }

      await loadGovernance();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to persist governance action");
    } finally {
      setPostingPresetId(null);
    }
  };

  const toggleHistory = (presetId: string) => {
    setExpandedHistoryByPreset((prev) => ({ ...prev, [presetId]: !prev[presetId] }));
  };

  if (loading || !data) {
    return (
      <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">Loading governance telemetry…</Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 3 }}><MetricCard label="Total tracked runs" value={String(data.totals.totalRuns)} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><MetricCard label="Successful runs" value={String(data.totals.successfulRuns)} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><MetricCard label="Avg confidence" value={`${(data.totals.avgConfidence * 100).toFixed(0)}%`} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><MetricCard label="Modules covered" value={`${data.totals.modulesCovered}/${data.totals.totalModules}`} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><MetricCard label="Approved runs" value={String(data.totals.approvedCount)} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><MetricCard label="Sent-back runs" value={String(data.totals.sentBackCount)} /></Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 2.5, border: "1px solid rgba(255,255,255,0.08)" }}>
        <Typography variant="overline" color="text.secondary">Reviewer identity (HITL)</Typography>
        <Grid container spacing={1.25} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField size="small" label="Reviewer name" value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField size="small" label="Reviewer role" value={reviewerRole} onChange={(e) => setReviewerRole(e.target.value)} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField size="small" label="Reviewer ID (optional)" value={reviewerId} onChange={(e) => setReviewerId(e.target.value)} fullWidth />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              size="small"
              label="Review note (optional)"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              fullWidth
            />
          </Grid>
        </Grid>
        {actionError && <Alert severity="error" sx={{ mt: 1.25 }}>{actionError}</Alert>}
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5, border: "1px solid rgba(255,255,255,0.08)" }}>
        <Typography variant="overline" color="text.secondary">Control state</Typography>
        <Stack spacing={1.2} sx={{ mt: 1.25 }}>
          {data.controls.map((control) => (
            <Stack key={control.id} direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between">
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{control.name}</Typography>
                <Chip
                  size="small"
                  label={control.state}
                  color={control.state === "enabled" ? "success" : control.state === "pilot" ? "warning" : "default"}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary">{control.note}</Typography>
            </Stack>
          ))}
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5, border: "1px solid rgba(255,255,255,0.08)" }}>
        <Typography variant="overline" color="text.secondary">Recent runs</Typography>
        <TableContainer sx={{ mt: 1.25 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Preset</TableCell>
                <TableCell>Module</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Frames</TableCell>
                <TableCell align="right">Tokens</TableCell>
                <TableCell align="right">Confidence</TableCell>
                <TableCell>HITL</TableCell>
                <TableCell>Reviewer</TableCell>
                <TableCell>History</TableCell>
                <TableCell align="right">Launch</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.runs.slice(0, 12).map((run) => {
                const isExpanded = expandedHistoryByPreset[run.presetId] ?? false;
                return (
                  <Fragment key={`${run.presetId}-${run.updatedAt}`}>
                    <TableRow>
                      <TableCell>{run.presetId}</TableCell>
                      <TableCell>{run.module.toUpperCase()}</TableCell>
                      <TableCell>
                        <Chip size="small" label={run.status} color={statusColor(run.status)} variant={run.status === "not-run" ? "outlined" : "filled"} />
                      </TableCell>
                      <TableCell align="right">{run.frameCount}</TableCell>
                      <TableCell align="right">{run.tokenCount}</TableCell>
                      <TableCell align="right">{typeof run.confidence === "number" ? `${(run.confidence * 100).toFixed(0)}%` : "—"}</TableCell>
                      <TableCell>
                        <Stack spacing={0.25}>
                          <Chip
                            size="small"
                            label={run.hitl.state}
                            color={hitlColor(run.hitl.state)}
                            variant={run.hitl.state === "pending" ? "outlined" : "filled"}
                          />
                          {run.hitl.reviewUpdatedAt && (
                            <Typography variant="caption" color="text.secondary">
                              {new Date(run.hitl.reviewUpdatedAt).toLocaleString()}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {run.hitl.reviewer ? (
                          <Stack spacing={0.25}>
                            <Typography variant="caption" sx={{ color: "text.primary" }}>
                              {run.hitl.reviewer.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {run.hitl.reviewer.role}
                            </Typography>
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <IconButton
                            size="small"
                            onClick={() => toggleHistory(run.presetId)}
                            aria-label={isExpanded ? "Hide history" : "Show history"}
                            sx={{ border: "1px solid rgba(255,255,255,0.12)" }}
                          >
                            {isExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                          </IconButton>
                          <Typography variant="caption" color="text.secondary">
                            {run.hitl.history.length} event{run.hitl.history.length === 1 ? "" : "s"}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          component={Link}
                          href={run.launchUrl}
                          size="small"
                          variant="outlined"
                          color="inherit"
                          endIcon={<LaunchIcon sx={{ fontSize: 14 }} />}
                          sx={{ borderColor: "rgba(255,255,255,0.16)" }}
                        >
                          Open
                        </Button>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction={{ xs: "column", md: "row" }} spacing={0.75} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            disabled={postingPresetId === run.presetId}
                            onClick={() => submitHITLAction(run.presetId, "approve")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="warning"
                            disabled={postingPresetId === run.presetId}
                            onClick={() => submitHITLAction(run.presetId, "send-back")}
                          >
                            Send back
                          </Button>
                          <Button
                            size="small"
                            variant="text"
                            color="inherit"
                            disabled={postingPresetId === run.presetId}
                            onClick={() => submitHITLAction(run.presetId, "reset")}
                          >
                            Reset
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell colSpan={11} sx={{ py: 0, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Stack spacing={0.75} sx={{ py: 1.25, px: 0.5 }}>
                            {run.hitl.history.length === 0 ? (
                              <Typography variant="caption" color="text.secondary">No prior review actions recorded.</Typography>
                            ) : (
                              [...run.hitl.history].reverse().map((entry, idx) => (
                                <Stack
                                  key={`${entry.at}-${entry.action}-${idx}`}
                                  direction={{ xs: "column", md: "row" }}
                                  spacing={1}
                                  justifyContent="space-between"
                                  sx={{ borderBottom: "1px dashed rgba(255,255,255,0.08)", pb: 0.75 }}
                                >
                                  <Stack direction="row" spacing={0.75} alignItems="center" useFlexGap flexWrap="wrap">
                                    <Chip size="small" label={entry.action} variant="outlined" />
                                    <Chip size="small" label={entry.state} color={hitlColor(entry.state)} />
                                    <Typography variant="caption" color="text.secondary">
                                      {new Date(entry.at).toLocaleString()}
                                    </Typography>
                                  </Stack>
                                  <Typography variant="caption" color="text.secondary">
                                    {entry.reviewer.name} · {entry.reviewer.role}
                                    {entry.comment ? ` · ${entry.comment}` : ""}
                                  </Typography>
                                </Stack>
                              ))
                            )}
                          </Stack>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  );
}
