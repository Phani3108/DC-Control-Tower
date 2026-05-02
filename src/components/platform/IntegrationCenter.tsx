"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SaveIcon from "@mui/icons-material/Save";
import ScienceIcon from "@mui/icons-material/Science";

interface IntegrationTestResult {
  ok: boolean;
  checkedAt: string;
  durationMs: number;
  mode: "sandbox" | "production";
  target?: string;
  detail: string;
  statusCode?: number;
  diagnostics?: Record<string, string | number | boolean | null>;
}

function diagnosticsLine(diagnostics: IntegrationTestResult["diagnostics"]): string | null {
  if (!diagnostics) return null;
  const entries = Object.entries(diagnostics)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${String(value)}`);
  return entries.length > 0 ? entries.join(" · ") : null;
}

interface IntegrationView {
  id: string;
  kind: "http" | "database";
  category: "ai" | "backend" | "data" | "connector" | "database";
  name: string;
  description: string;
  enabled: boolean;
  useSandbox: boolean;
  sourcePreference: "frontend-first" | "env-first";
  productionUrl?: string;
  sandboxUrl?: string;
  activeUrl?: string;
  timeoutMs: number;
  testPath?: string;
  method: "GET" | "POST";
  apiKeyHeader: string;
  extraHeaders: Record<string, string>;
  lastTest?: IntegrationTestResult;
  lastDeepTest?: IntegrationTestResult;
  hasApiKey: boolean;
  hasBearerToken: boolean;
  hasBasicAuth: boolean;
  hasCustomAuthHeader: boolean;
  hasDsn: boolean;
  secretPreview: {
    apiKey?: string;
    bearerToken?: string;
    dsn?: string;
  };
}

interface IntegrationDraft extends IntegrationView {
  apiKey?: string;
  bearerToken?: string;
  basicUsername?: string;
  basicPassword?: string;
  authHeaderName?: string;
  authHeaderValue?: string;
  dsn?: string;
  sandboxApiKey?: string;
  sandboxBearerToken?: string;
  sandboxBasicUsername?: string;
  sandboxBasicPassword?: string;
  sandboxAuthHeaderName?: string;
  sandboxAuthHeaderValue?: string;
  sandboxDsn?: string;
}

function categoryLabel(category: IntegrationView["category"]): string {
  if (category === "ai") return "AI Platforms";
  if (category === "database") return "Databases";
  if (category === "connector") return "External Connectors";
  if (category === "data") return "Data APIs";
  return "Backend Services";
}

function statusChip(integration: IntegrationView): { label: string; color: "success" | "warning" | "error" | "default" } {
  if (!integration.lastTest) return { label: "not tested", color: "default" };
  if (integration.lastTest.ok) return { label: "working", color: "success" };
  if (integration.enabled) return { label: "failing", color: "error" };
  return { label: "disabled", color: "warning" };
}

export function IntegrationCenter() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingAll, setTestingAll] = useState(false);
  const [deepTestingAll, setDeepTestingAll] = useState(false);
  const [runningSandbox, setRunningSandbox] = useState(false);
  const [deepTestingById, setDeepTestingById] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, IntegrationDraft>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        const res = await fetch("/api/integrations/config", { cache: "no-store" });
        const json = (await res.json()) as { ok: boolean; integrations?: IntegrationView[]; message?: string };
        if (!alive) return;

        if (!res.ok || !json.ok || !json.integrations) {
          setError(json.message ?? "Failed to load integration settings.");
          return;
        }

        const next: Record<string, IntegrationDraft> = {};
        for (const item of json.integrations) {
          next[item.id] = { ...item };
        }
        setDrafts(next);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Failed to load integration settings.");
      } finally {
        if (alive) setLoading(false);
      }
    };

    void run();

    return () => {
      alive = false;
    };
  }, []);

  const grouped = useMemo(() => {
    const all = Object.values(drafts);
    return {
      ai: all.filter((item) => item.category === "ai"),
      backend: all.filter((item) => item.category === "backend"),
      connector: all.filter((item) => item.category === "connector"),
      data: all.filter((item) => item.category === "data"),
      database: all.filter((item) => item.category === "database"),
    };
  }, [drafts]);

  const setField = <K extends keyof IntegrationDraft>(id: string, field: K, value: IntegrationDraft[K]) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const saveAll = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload = Object.values(drafts).map((d) => ({
        id: d.id,
        enabled: d.enabled,
        useFrontendConfig: d.sourcePreference === "frontend-first",
        useSandbox: d.useSandbox,
        productionUrl: d.productionUrl,
        sandboxUrl: d.sandboxUrl,
        timeoutMs: Number(d.timeoutMs),
        testPath: d.testPath,
        method: d.method,
        apiKeyHeader: d.apiKeyHeader,
        apiKey: d.apiKey,
        bearerToken: d.bearerToken,
        basicUsername: d.basicUsername,
        basicPassword: d.basicPassword,
        authHeaderName: d.authHeaderName,
        authHeaderValue: d.authHeaderValue,
        dsn: d.dsn,
        sandboxApiKey: d.sandboxApiKey,
        sandboxBearerToken: d.sandboxBearerToken,
        sandboxBasicUsername: d.sandboxBasicUsername,
        sandboxBasicPassword: d.sandboxBasicPassword,
        sandboxAuthHeaderName: d.sandboxAuthHeaderName,
        sandboxAuthHeaderValue: d.sandboxAuthHeaderValue,
        sandboxDsn: d.sandboxDsn,
      }));

      const res = await fetch("/api/integrations/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrations: payload }),
      });
      const json = (await res.json()) as { ok: boolean; message?: string; integrations?: IntegrationView[] };
      if (!res.ok || !json.ok || !json.integrations) {
        setError(json.message ?? "Failed to save integration settings.");
        return;
      }

      const next: Record<string, IntegrationDraft> = {};
      for (const item of json.integrations) {
        next[item.id] = { ...item };
      }
      setDrafts(next);
      setMessage("Settings saved. .env fallback remains active when frontend values are missing.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save integration settings.");
    } finally {
      setSaving(false);
    }
  };

  const testOne = async (id: string) => {
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        id?: string;
        result?: IntegrationTestResult;
        message?: string;
      };
      if (!json.result) {
        setError(json.message ?? "Test failed.");
        return;
      }

      setDrafts((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          lastTest: json.result,
        },
      }));
      setMessage(`${id}: ${json.result.detail}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test failed.");
    }
  };

  const deepTestOne = async (id: string) => {
    setError(null);
    setMessage(null);
    setDeepTestingById((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch("/api/integrations/deep-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        id?: string;
        result?: IntegrationTestResult;
        message?: string;
      };
      if (!json.result) {
        setError(json.message ?? "Deep test failed.");
        return;
      }

      setDrafts((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          lastDeepTest: json.result,
        },
      }));
      setMessage(`${id} deep-test: ${json.result.detail}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deep test failed.");
    } finally {
      setDeepTestingById((prev) => ({ ...prev, [id]: false }));
    }
  };

  const testAll = async () => {
    setTestingAll(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        results?: Array<{ id: string; result: IntegrationTestResult }>;
        message?: string;
      };
      if (!res.ok || !json.ok || !json.results) {
        setError(json.message ?? "Failed to run connection tests.");
        return;
      }

      setDrafts((prev) => {
        const next = { ...prev };
        for (const item of json.results ?? []) {
          if (!next[item.id]) continue;
          next[item.id] = { ...next[item.id], lastTest: item.result };
        }
        return next;
      });

      const failing = json.results.filter((item) => !item.result.ok).length;
      setMessage(
        failing === 0
          ? `All ${json.results.length} enabled integrations are functioning.`
          : `${failing} of ${json.results.length} enabled integrations are failing. Open each card for details.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run connection tests.");
    } finally {
      setTestingAll(false);
    }
  };

  const deepTestAll = async () => {
    setDeepTestingAll(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/integrations/deep-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        results?: Array<{ id: string; result: IntegrationTestResult }>;
        message?: string;
      };
      if (!res.ok || !json.ok || !json.results) {
        setError(json.message ?? "Failed to run deep tests.");
        return;
      }

      setDrafts((prev) => {
        const next = { ...prev };
        for (const item of json.results ?? []) {
          if (!next[item.id]) continue;
          next[item.id] = { ...next[item.id], lastDeepTest: item.result };
        }
        return next;
      });

      const failing = json.results.filter((item) => !item.result.ok).length;
      setMessage(
        failing === 0
          ? `All ${json.results.length} enabled integrations passed deep tests.`
          : `${failing} of ${json.results.length} enabled integrations failed deep tests.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run deep tests.");
    } finally {
      setDeepTestingAll(false);
    }
  };

  const runSandboxSmoke = async () => {
    setRunningSandbox(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/integrations/test-run", {
        method: "POST",
      });
      const json = (await res.json()) as {
        ok: boolean;
        message?: string;
        checks?: Array<{ id: string; ok: boolean; detail: string }>;
      };

      if (!res.ok || !json.checks) {
        setError(json.message ?? "Sandbox run failed.");
        return;
      }

      const failed = json.checks.filter((item) => !item.ok);
      setMessage(
        failed.length === 0
          ? `Sandbox smoke run passed for ${json.checks.length} integrations.`
          : `Sandbox smoke run found ${failed.length} failures.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sandbox run failed.");
    } finally {
      setRunningSandbox(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={20} />
          <Typography color="text.secondary">Loading integrations…</Typography>
        </Stack>
      </Box>
    );
  }

  const sections: Array<keyof typeof grouped> = ["ai", "backend", "connector", "data", "database"];

  return (
    <Box sx={{ pb: 8 }}>
      <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.06)", py: 3 }}>
        <Container maxWidth="xl">
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "flex-start", md: "center" }}>
            <Button
              component={Link}
              href="/platform"
              variant="text"
              color="inherit"
              startIcon={<ArrowBackIcon />}
              sx={{ color: "text.secondary" }}
            >
              Platform
            </Button>
            <Box sx={{ flex: 1 }}>
              <Chip label="Integration Center" color="primary" size="small" sx={{ mb: 1 }} />
              <Typography variant="h4">Configure AI APIs, databases, and connectors from the frontend</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Save credentials, toggle sandbox mode, run connection tests, and inspect failure details without leaving the app.
              </Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <Button variant="outlined" startIcon={<ScienceIcon />} onClick={testAll} disabled={testingAll}>
                {testingAll ? "Testing…" : "Test all enabled"}
              </Button>
              <Button variant="outlined" onClick={deepTestAll} disabled={deepTestingAll}>
                {deepTestingAll ? "Deep testing…" : "Deep test all enabled"}
              </Button>
              <Button variant="outlined" startIcon={<PlayArrowIcon />} onClick={runSandboxSmoke} disabled={runningSandbox}>
                {runningSandbox ? "Running…" : "Run sandbox smoke"}
              </Button>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={saveAll} disabled={saving}>
                {saving ? "Saving…" : "Save settings"}
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ pt: 3 }}>
        <Stack spacing={2} sx={{ mb: 3 }}>
          {message ? <Alert severity="success">{message}</Alert> : null}
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Alert severity="info">
            Frontend-saved values are stored in a local server-side file and never returned to the browser in plain text. If a field is missing,
            the runtime falls back to environment variables from backend .env.
          </Alert>
        </Stack>

        <Stack spacing={4}>
          {sections.map((sectionKey) => {
            const items = grouped[sectionKey];
            if (items.length === 0) return null;

            return (
              <Box key={sectionKey}>
                <Typography variant="h6" sx={{ mb: 1.5 }}>
                  {categoryLabel(items[0].category)}
                </Typography>
                <Grid container spacing={2}>
                  {items.map((integration) => {
                    const status = statusChip(integration);
                    return (
                      <Grid key={integration.id} size={{ xs: 12, lg: 6 }}>
                        <Card sx={{ border: "1px solid rgba(255,255,255,0.08)", height: "100%" }}>
                          <CardContent>
                            <Stack spacing={1.5}>
                              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                <Typography variant="h6" sx={{ fontSize: 18 }}>
                                  {integration.name}
                                </Typography>
                                <Chip label={status.label} color={status.color} size="small" />
                              </Stack>

                              <Typography variant="body2" color="text.secondary">
                                {integration.description}
                              </Typography>

                              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                                <Stack direction="row" spacing={0.8} alignItems="center">
                                  <Switch
                                    checked={integration.enabled}
                                    onChange={(e) => setField(integration.id, "enabled", e.target.checked)}
                                  />
                                  <Typography variant="caption">Enabled</Typography>
                                </Stack>
                                <Stack direction="row" spacing={0.8} alignItems="center">
                                  <Switch
                                    checked={integration.sourcePreference === "frontend-first"}
                                    onChange={(e) =>
                                      setField(
                                        integration.id,
                                        "sourcePreference",
                                            e.target.checked ? "frontend-first" : "env-first",
                                      )
                                    }
                                  />
                                  <Typography variant="caption">Frontend config priority</Typography>
                                </Stack>
                                <Stack direction="row" spacing={0.8} alignItems="center">
                                  <Switch
                                    checked={integration.useSandbox}
                                    onChange={(e) => setField(integration.id, "useSandbox", e.target.checked)}
                                  />
                                  <Typography variant="caption">Use sandbox</Typography>
                                </Stack>
                              </Stack>

                              <Grid container spacing={1.2}>
                                {integration.kind === "http" ? (
                                  <>
                                    <Grid size={{ xs: 12 }}>
                                      <TextField
                                        label="Production URL"
                                        fullWidth
                                        size="small"
                                        value={integration.productionUrl ?? ""}
                                        onChange={(e) => setField(integration.id, "productionUrl", e.target.value)}
                                      />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                      <TextField
                                        label="Sandbox URL"
                                        fullWidth
                                        size="small"
                                        value={integration.sandboxUrl ?? ""}
                                        onChange={(e) => setField(integration.id, "sandboxUrl", e.target.value)}
                                      />
                                    </Grid>
                                    <Grid size={{ xs: 8 }}>
                                      <TextField
                                        label="Test path"
                                        fullWidth
                                        size="small"
                                        value={integration.testPath ?? ""}
                                        onChange={(e) => setField(integration.id, "testPath", e.target.value)}
                                      />
                                    </Grid>
                                    <Grid size={{ xs: 4 }}>
                                      <TextField
                                        label="Method"
                                        fullWidth
                                        size="small"
                                        value={integration.method}
                                        onChange={(e) => {
                                          const next = e.target.value.toUpperCase() === "POST" ? "POST" : "GET";
                                          setField(integration.id, "method", next);
                                        }}
                                      />
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                      <TextField
                                        label="API key header"
                                        fullWidth
                                        size="small"
                                        value={integration.apiKeyHeader ?? ""}
                                        onChange={(e) => setField(integration.id, "apiKeyHeader", e.target.value)}
                                      />
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                      <TextField
                                        label="Timeout (ms)"
                                        type="number"
                                        fullWidth
                                        size="small"
                                        value={integration.timeoutMs ?? 2500}
                                        onChange={(e) => setField(integration.id, "timeoutMs", Number(e.target.value || 2500))}
                                      />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                      <TextField
                                        label={`API key (${integration.secretPreview.apiKey ?? "not set"})`}
                                        fullWidth
                                        size="small"
                                        type="password"
                                        autoComplete="new-password"
                                        value={integration.apiKey ?? ""}
                                        onChange={(e) => setField(integration.id, "apiKey", e.target.value)}
                                      />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                      <TextField
                                        label={`Bearer token (${integration.secretPreview.bearerToken ?? "not set"})`}
                                        fullWidth
                                        size="small"
                                        type="password"
                                        autoComplete="new-password"
                                        value={integration.bearerToken ?? ""}
                                        onChange={(e) => setField(integration.id, "bearerToken", e.target.value)}
                                      />
                                    </Grid>
                                  </>
                                ) : (
                                  <>
                                    <Grid size={{ xs: 12 }}>
                                      <TextField
                                        label={`Database DSN (${integration.secretPreview.dsn ?? "not set"})`}
                                        fullWidth
                                        size="small"
                                        type="password"
                                        autoComplete="new-password"
                                        value={integration.dsn ?? ""}
                                        onChange={(e) => setField(integration.id, "dsn", e.target.value)}
                                      />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                      <TextField
                                        label="Sandbox DSN"
                                        fullWidth
                                        size="small"
                                        type="password"
                                        autoComplete="new-password"
                                        value={integration.sandboxDsn ?? ""}
                                        onChange={(e) => setField(integration.id, "sandboxDsn", e.target.value)}
                                      />
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                      <TextField
                                        label="Timeout (ms)"
                                        type="number"
                                        fullWidth
                                        size="small"
                                        value={integration.timeoutMs ?? 2500}
                                        onChange={(e) => setField(integration.id, "timeoutMs", Number(e.target.value || 2500))}
                                      />
                                    </Grid>
                                  </>
                                )}
                              </Grid>

                              {integration.lastTest ? (
                                <Alert severity={integration.lastTest.ok ? "success" : "error"}>
                                  {integration.lastTest.detail}
                                  {integration.lastTest.target ? ` · target: ${integration.lastTest.target}` : ""}
                                  {` · ${integration.lastTest.durationMs}ms · ${integration.lastTest.mode}`}
                                  {diagnosticsLine(integration.lastTest.diagnostics)
                                    ? ` · ${diagnosticsLine(integration.lastTest.diagnostics)}`
                                    : ""}
                                </Alert>
                              ) : (
                                <Alert severity="info">No test run yet.</Alert>
                              )}

                              {integration.lastDeepTest ? (
                                <Alert severity={integration.lastDeepTest.ok ? "success" : "error"}>
                                  {`Deep: ${integration.lastDeepTest.detail}`}
                                  {integration.lastDeepTest.target ? ` · target: ${integration.lastDeepTest.target}` : ""}
                                  {` · ${integration.lastDeepTest.durationMs}ms · ${integration.lastDeepTest.mode}`}
                                  {diagnosticsLine(integration.lastDeepTest.diagnostics)
                                    ? ` · ${diagnosticsLine(integration.lastDeepTest.diagnostics)}`
                                    : ""}
                                </Alert>
                              ) : (
                                <Alert severity="info">No deep test run yet.</Alert>
                              )}

                              <Divider />

                              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                <Button variant="outlined" onClick={() => testOne(integration.id)}>
                                  Test connection
                                </Button>
                                <Button
                                  variant="outlined"
                                  onClick={() => deepTestOne(integration.id)}
                                  disabled={deepTestingById[integration.id] === true}
                                >
                                  {deepTestingById[integration.id] ? "Deep testing…" : "Deep test"}
                                </Button>
                                <Button
                                  variant="text"
                                  color="inherit"
                                  onClick={() => {
                                    setField(integration.id, "apiKey", "");
                                    setField(integration.id, "bearerToken", "");
                                    setField(integration.id, "dsn", "");
                                  }}
                                >
                                  Clear input fields
                                </Button>
                              </Stack>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            );
          })}
        </Stack>
      </Container>
    </Box>
  );
}
