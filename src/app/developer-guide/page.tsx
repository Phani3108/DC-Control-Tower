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

const setupSteps = [
  "Install dependencies: npm install --legacy-peer-deps, then pip install -e . inside fastapi/.",
  "Copy .env.example to .env.local and set ANTHROPIC_API_KEY and FASTAPI_URL.",
  "Run both tiers: npm run dev and uvicorn main:app --reload (from fastapi/).",
  "Open /integrations to configure AI APIs, databases, and connectors from frontend.",
  "Run Test all enabled, Deep test all enabled, and Run sandbox smoke before demo or deployment.",
];

const designRules = [
  "All browser-to-model requests route through Next.js /api/agents proxy. Secrets stay server-side.",
  "Deterministic engines live in src/lib/m1..m8. Agent reasoning lives in fastapi/agents.",
  "Integration settings are saved to src/data/integrations/settings.local.json (gitignored pattern recommended).",
  "Runtime always falls back to process.env when frontend settings are absent.",
  "Every external dependency should be testable from /integrations and via /api/integrations/test.",
  "Phase-2/2.1 deep tests add provider-specific checks: AI model-list validation, Postgres/MySQL login+query, Redis PING, and Mongo admin ping.",
  "Phase-2.2 adds structured diagnostics in deep-test responses for operator-friendly troubleshooting.",
];

const troubleshooting = [
  {
    title: "Agents appear down in footer",
    details: "Check FASTAPI_URL in /integrations (fastapi-agents) or .env, then test connection. Verify FastAPI /v1/health is reachable.",
  },
  {
    title: "M7 live ingestion falls back to mock",
    details: "Configure m7-utility-feed and m7-market-feed URLs/auth in /integrations. Run test on each connector and then retry M7 ingest.",
  },
  {
    title: "EIA or Ember proxies only return snapshots",
    details: "Set API keys for eia-data and ember-data in /integrations or backend .env. Test and verify 200 responses.",
  },
  {
    title: "Database test fails",
    details: "Verify DSN is reachable from server network. Current test is TCP-level connectivity (host:port), not full SQL handshake.",
  },
];

export default function DeveloperGuidePage() {
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
            <Chip label="Developer Guide" color="primary" size="small" sx={{ alignSelf: "flex-start" }} />
            <Typography variant="h3">Build, connect, test, and ship the DC Control Tower stack</Typography>
            <Typography color="text.secondary">
              This guide focuses on day-0 setup, integration management, backend/frontend contracts, and operational runbooks.
            </Typography>
          </Stack>

          <Paper variant="outlined" sx={{ p: 2.5, borderColor: "rgba(255,255,255,0.12)" }}>
            <Typography variant="h5" sx={{ mb: 1.5 }}>Local setup workflow</Typography>
            <Stack spacing={1.2}>
              {setupSteps.map((step, idx) => (
                <Typography key={step} variant="body2" color="text.secondary">
                  {`${idx + 1}. ${step}`}
                </Typography>
              ))}
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.5, borderColor: "rgba(255,255,255,0.12)" }}>
            <Typography variant="h5" sx={{ mb: 1.5 }}>Integration architecture</Typography>
            <Stack spacing={1.2}>
              {designRules.map((rule) => (
                <Typography key={rule} variant="body2" color="text.secondary">{`• ${rule}`}</Typography>
              ))}
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Frontend integration control plane: <strong>/integrations</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Config API: <strong>/api/integrations/config</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Test APIs: <strong>/api/integrations/test</strong>, <strong>/api/integrations/test-run</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Deep test API: <strong>/api/integrations/deep-test</strong>
            </Typography>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.5, borderColor: "rgba(255,255,255,0.12)" }}>
            <Typography variant="h5" sx={{ mb: 1.5 }}>Recommended delivery checklist</Typography>
            <Stack spacing={1.2}>
              <Typography variant="body2" color="text.secondary">• Run lint, typecheck, tests, and build before pushing.</Typography>
              <Typography variant="body2" color="text.secondary">• Test all enabled integrations and archive test evidence (timestamp + status).</Typography>
              <Typography variant="body2" color="text.secondary">• Run deep tests for AI providers and all database integrations before production cutover.</Typography>
              <Typography variant="body2" color="text.secondary">• Validate one end-to-end run for each module preset (M1-M8).</Typography>
              <Typography variant="body2" color="text.secondary">• Confirm sandbox mode for demos and production mode for live workloads.</Typography>
              <Typography variant="body2" color="text.secondary">• Update /api-docs and this guide when adding/changing API contracts.</Typography>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.5, borderColor: "rgba(255,255,255,0.12)" }}>
            <Typography variant="h5" sx={{ mb: 1.5 }}>Troubleshooting runbook</Typography>
            <Stack spacing={1.5}>
              {troubleshooting.map((item) => (
                <Box key={item.title}>
                  <Typography variant="subtitle1">{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.details}</Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
