"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const endpoints = [
  {
    method: "GET",
    path: "/api/integrations/config",
    purpose: "Returns integration catalog + masked current settings + last test results.",
    notes: "Secrets are never returned in plain text.",
  },
  {
    method: "POST",
    path: "/api/integrations/config",
    purpose: "Saves frontend integration settings for AI APIs, DB DSNs, and connector auth.",
    notes: "Body includes integrations[] with id, flags, urls, testPath, auth/secret fields.",
  },
  {
    method: "POST",
    path: "/api/integrations/test",
    purpose: "Runs connectivity tests for one integration or all enabled integrations.",
    notes: "For DB: TCP probe. For HTTP: authenticated request with timeout.",
  },
  {
    method: "POST",
    path: "/api/integrations/deep-test",
    purpose: "Runs provider-specific deep validation (AI model lists, DB login/query).",
    notes: "Postgres/MySQL run login+query; Redis runs PING; Mongo runs db.admin().ping(); AI providers validate model-list payloads.",
  },
  {
    method: "POST",
    path: "/api/integrations/test-run",
    purpose: "Runs sandbox smoke checks for enabled integrations marked useSandbox=true.",
    notes: "Use before demo runs and staging validation.",
  },
  {
    method: "GET",
    path: "/api/health",
    purpose: "Returns web + fastapi-agents health used by footer HealthBadge.",
    notes: "FastAPI target resolves from frontend config first or .env fallback.",
  },
  {
    method: "GET",
    path: "/api/connectors/m7/power-signals",
    purpose: "Fetches utility + market telemetry for M7 with auth and fallback mocking.",
    notes: "Uses m7-utility-feed and m7-market-feed integration settings.",
  },
];

const examplePayloads = [
  {
    title: "Save integration settings",
    code: `POST /api/integrations/config\n{\n  "integrations": [\n    {\n      "id": "anthropic",\n      "enabled": true,\n      "useFrontendConfig": true,\n      "useSandbox": true,\n      "productionUrl": "https://api.anthropic.com",\n      "sandboxUrl": "https://api.anthropic.com",\n      "testPath": "/v1/models",\n      "apiKeyHeader": "x-api-key",\n      "apiKey": "sk-ant-prod-...",\n      "sandboxApiKey": "sk-ant-sandbox-..."\n    },\n    {\n      "id": "postgres-primary",\n      "enabled": true,\n      "useFrontendConfig": true,\n      "useSandbox": false,\n      "dsn": "postgres://user:pass@db-host:5432/app"\n    }\n  ]\n}`,
  },
  {
    title: "Test one integration",
    code: `POST /api/integrations/test\n{\n  "id": "postgres-primary"\n}`,
  },
  {
    title: "Test all enabled integrations",
    code: `POST /api/integrations/test\n{\n  "all": true\n}`,
  },
  {
    title: "Deep test all enabled integrations",
    code: `POST /api/integrations/deep-test\n{\n  "all": true\n}`,
  },
  {
    title: "Run sandbox smoke suite",
    code: `POST /api/integrations/test-run`,
  },
];

const responseShapes = [
  "IntegrationTestResult: ok, checkedAt, durationMs, mode, target, detail, statusCode.",
  "IntegrationView: id, kind, category, enabled, sourcePreference, URLs, timeout, testPath, lastTest, lastDeepTest, secretPreview flags.",
  "Sandbox summary: ok, executedAt, checks[] with id + pass/fail detail.",
];

export default function ApiDocsPage() {
  return (
    <Box sx={{ minHeight: "100vh", py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Button
            component={Link}
            href="/"
            variant="text"
            color="inherit"
            startIcon={<ArrowBackIcon />}
            sx={{ alignSelf: "flex-start", color: "text.secondary" }}
          >
            Home
          </Button>

          <Stack spacing={1}>
            <Chip label="API Docs" color="primary" size="small" sx={{ alignSelf: "flex-start" }} />
            <Typography variant="h3">Control Tower API reference</Typography>
            <Typography color="text.secondary">
              Integration APIs, health endpoints, connector contracts, and test workflow for frontend-visible diagnostics.
            </Typography>
          </Stack>

          <Paper variant="outlined" sx={{ p: 2.5, borderColor: "rgba(255,255,255,0.12)" }}>
            <Typography variant="h5" sx={{ mb: 1.5 }}>Endpoints</Typography>
            <Stack spacing={1.3}>
              {endpoints.map((endpoint) => (
                <Box key={`${endpoint.method}-${endpoint.path}`}>
                  <Typography variant="subtitle1">{`${endpoint.method} ${endpoint.path}`}</Typography>
                  <Typography variant="body2" color="text.secondary">{endpoint.purpose}</Typography>
                  <Typography variant="caption" color="text.secondary">{endpoint.notes}</Typography>
                </Box>
              ))}
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.5, borderColor: "rgba(255,255,255,0.12)" }}>
            <Typography variant="h5" sx={{ mb: 1.5 }}>Request examples</Typography>
            <Stack spacing={2}>
              {examplePayloads.map((example) => (
                <Box key={example.title}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>{example.title}</Typography>
                  <Box
                    component="pre"
                    sx={{
                      m: 0,
                      p: 1.5,
                      borderRadius: 1.5,
                      bgcolor: "rgba(255,255,255,0.04)",
                      overflowX: "auto",
                      fontSize: 12,
                      lineHeight: 1.45,
                    }}
                  >
                    {example.code}
                  </Box>
                </Box>
              ))}
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.5, borderColor: "rgba(255,255,255,0.12)" }}>
            <Typography variant="h5" sx={{ mb: 1.5 }}>Response contracts</Typography>
            <Stack spacing={1.2}>
              {responseShapes.map((item) => (
                <Typography key={item} variant="body2" color="text.secondary">{`• ${item}`}</Typography>
              ))}
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Error handling pattern: all endpoints return JSON with clear message fields; failing integration tests store lastTest detail for frontend visibility.
            </Typography>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
