"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import TerrainIcon from "@mui/icons-material/Terrain";
import HandshakeIcon from "@mui/icons-material/Handshake";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import GavelIcon from "@mui/icons-material/Gavel";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { GlobalMap } from "@/components/home/GlobalMap";

type ModuleCard = {
  id: "m1" | "m2" | "m3" | "m4";
  title: string;
  subtitle: string;
  audience: string;
  question: string;
  href: string;
  icon: React.ReactNode;
  preset?: { label: string; href: string };
};

const MODULES: ModuleCard[] = [
  {
    id: "m1",
    title: "Site Intelligence",
    subtitle: "Where to deploy the next tranche of capacity",
    audience: "Board · CapEx Committee",
    question: "Where should DAMAC deploy the next 500 MW?",
    href: "/m1-site-intelligence",
    icon: <TerrainIcon fontSize="large" />,
    preset: { label: "Demo · SEA 500 MW", href: "/m1-site-intelligence?preset=m1-sea-500mw" },
  },
  {
    id: "m2",
    title: "Capacity Matcher",
    subtitle: "Match customer workloads to DAMAC facilities",
    audience: "Sales · BD · Hyperscaler desk",
    question: "Which facility fits a 40-MW B200 training cluster?",
    href: "/m2-capacity-matcher",
    icon: <HandshakeIcon fontSize="large" />,
    preset: { label: "Demo · 40 MW B200 RFP", href: "/m2-capacity-matcher?preset=m2-anthropic-b200-40mw" },
  },
  {
    id: "m3",
    title: "Ops Control Tower",
    subtitle: "Predict, diagnose, and simulate DC operations",
    audience: "Ops · SRE · Incident Command",
    question: "What's at risk in Zone B in the next 6 hours?",
    href: "/m3-ops-tower",
    icon: <MonitorHeartIcon fontSize="large" />,
    preset: { label: "Demo · Zone B latency spike", href: "/m3-ops-tower?preset=m3-zoneb-latency-0417" },
  },
  {
    id: "m4",
    title: "Sovereignty Grid",
    subtitle: "Place workloads under the right jurisdictions",
    audience: "CISO · Customers · Legal",
    question: "Saudi fintech inference with EU customer data — where?",
    href: "/m4-sovereignty",
    icon: <GavelIcon fontSize="large" />,
    preset: { label: "Demo · KSA fintech + EU data", href: "/m4-sovereignty?preset=m4-ksa-fintech-eu-data" },
  },
];

const KPIS = [
  { label: "MW planned", value: "4,000+" },
  { label: "MW operational (2026)", value: "300+" },
  { label: "Countries", value: "12" },
  { label: "Open proposals", value: "3" },
  { label: "Open incidents", value: "2" },
  { label: "Compliance flags", value: "1" },
];

export default function HomePage() {
  return (
    <Box sx={{ minHeight: "100vh", pb: 8 }}>
      <Box
        sx={{
          background:
            "radial-gradient(1200px 500px at 10% -10%, rgba(201,166,107,0.15), transparent 60%), radial-gradient(900px 400px at 90% 10%, rgba(79,124,172,0.18), transparent 60%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Container maxWidth="lg" sx={{ pt: 8, pb: 6 }}>
          <Chip
            label="Interview artefact · AI Head · DAMAC Digital"
            size="small"
            sx={{ mb: 2, bgcolor: "rgba(201,166,107,0.14)", color: "primary.light" }}
          />
          <Typography variant="h2" sx={{ mb: 1.5, maxWidth: 820 }}>
            DC Control Tower
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: "text.secondary", mb: 3, maxWidth: 820, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}
          >
            A unified AI command center across site strategy, capacity GTM, DC operations, and sovereignty — designed for the next 4,000 MW of AI-ready capacity.
          </Typography>

          <Grid container spacing={2} sx={{ mt: 2 }}>
            {KPIS.map((k) => (
              <Grid key={k.label} size={{ xs: 6, sm: 4, md: 2 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <Typography variant="h4" sx={{ color: "primary.light" }}>{k.value}</Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>{k.label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Global map */}
      <Container maxWidth="lg" sx={{ pt: 6, mb: 4 }}>
        <GlobalMap />
      </Container>

      {/* Modules */}
      <Container maxWidth="lg">
        <Typography variant="h6" sx={{ mb: 3, color: "text.secondary" }}>
          Four modules · One control tower
        </Typography>

        <Grid container spacing={3}>
          {MODULES.map((m) => (
            <Grid key={m.id} size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: "100%",
                  border: "1px solid rgba(255,255,255,0.08)",
                  transition: "border-color 0.15s, transform 0.15s",
                  "&:hover": { borderColor: "primary.main", transform: "translateY(-2px)" },
                }}
              >
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <Box sx={{ color: "primary.light", pt: 0.5 }}>{m.icon}</Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="overline" sx={{ color: "text.secondary" }}>
                      {m.id.toUpperCase()} · {m.audience}
                    </Typography>
                    <Typography variant="h5">{m.title}</Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                      {m.subtitle}
                    </Typography>
                  </Box>
                </Stack>

                <Typography
                  variant="body2"
                  sx={{
                    p: 2,
                    mb: 2,
                    bgcolor: "rgba(201,166,107,0.06)",
                    borderLeft: "3px solid",
                    borderColor: "primary.main",
                    fontStyle: "italic",
                    color: "text.primary",
                  }}
                >
                  {m.question}
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button component={Link} href={m.href} variant="contained" color="primary" endIcon={<ArrowForwardIcon />}>
                    Open
                  </Button>
                  {m.preset && (
                    <Button component={Link} href={m.preset.href} variant="outlined" color="inherit">
                      {m.preset.label}
                    </Button>
                  )}
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            mt: 6,
            border: "1px dashed rgba(201,166,107,0.3)",
            bgcolor: "rgba(201,166,107,0.03)",
          }}
        >
          <Typography variant="overline" color="primary.light">Interview walkthrough</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Each demo preset deep-links to a pre-loaded scenario. 10-minute narrative:
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 1.5, fontFamily: "monospace", color: "text.primary" }}
          >
            Home → M1 SEA 500 MW → M2 40 MW B200 → M3 Zone B latency → M4 KSA fintech + EU data → Home
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
            Full script in <code>docs/DEMO_SCRIPT.md</code>. Set <code>MOCK_AGENTS=true</code> for offline-reliable demos.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
