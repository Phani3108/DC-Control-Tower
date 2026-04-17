"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { runM3 } from "@/lib/m3/engines";
import type { M3Input } from "@/lib/m3/types";
import { getPreset } from "@/data/presets";
import { TelemetryDashboard } from "./TelemetryDashboard";
import { IncidentTimeline } from "./IncidentTimeline";
import { RiskPanel } from "./RiskPanel";
import { SimulationPanel } from "./SimulationPanel";
import { RCAStream } from "./RCAStream";
import { NLQueryChat } from "./NLQueryChat";

const DEFAULT_INPUT: M3Input = {
  incidentId: "INC-2026-0417-01",
  startTime: "2026-04-17T04:17:00Z",
  zone: "Riyadh-1 / Zone-B",
  telemetryPreset: "zoneb-latency-0417",
};

export function M3SimulatorShell() {
  const searchParams = useSearchParams();
  const presetId = searchParams.get("preset");

  const [input] = useState<M3Input>(() => {
    if (presetId) {
      const p = getPreset(presetId);
      if (p && p.module === "m3") return p.input as M3Input;
    }
    return DEFAULT_INPUT;
  });

  const [tab, setTab] = useState(0);
  const output = useMemo(() => runM3(input), [input]);
  const preset = presetId ? getPreset(presetId) : undefined;

  return (
    <Box sx={{ pb: 8 }}>
      <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.06)", py: 3 }}>
        <Container maxWidth="xl">
          <Stack direction="row" alignItems="flex-start" spacing={3}>
            <Button
              component={Link}
              href="/"
              variant="text"
              color="inherit"
              startIcon={<ArrowBackIcon />}
              sx={{ color: "text.secondary", mt: 0.5 }}
            >
              Control Tower
            </Button>
            <Box sx={{ flex: 1 }}>
              <Chip label="M3 · Ops Control Tower" color="primary" size="small" sx={{ mb: 1 }} />
              <Typography variant="h4">{preset?.title ?? "Active incident — live telemetry + RCA"}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {preset?.description ??
                  "Synthetic telemetry feed + anomaly detection + multi-agent RCA debate + natural-language ops queries + what-if simulations."}
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <TelemetryDashboard series={output.series} />
            <Box sx={{ mt: 3 }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
                <Tab label="RCA Debate" />
                <Tab label="Ask" />
                <Tab label="Simulations" />
              </Tabs>
              {tab === 0 && <RCAStream output={output} presetId={presetId ?? undefined} />}
              {tab === 1 && <NLQueryChat output={output} />}
              {tab === 2 && <SimulationPanel simulations={output.simulations} />}
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3}>
              <RiskPanel risks={output.failureRisks} />
              <IncidentTimeline output={output} />
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
