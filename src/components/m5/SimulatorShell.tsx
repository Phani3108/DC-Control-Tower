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
import { runM5 } from "@/lib/m5/engines";
import type { M5Input } from "@/lib/m5/types";
import { getPreset } from "@/data/presets";
import { InputPanel } from "./InputPanel";
import { CriticalPathView } from "./CriticalPathView";
import { RiskHeatmap } from "./RiskHeatmap";
import { ProjectMemoView } from "./ProjectMemoView";
import { BuildDebateStream } from "./BuildDebateStream";

const DEFAULT_INPUT: M5Input = {
  projectId: "PRJ-JKT-19MW-P1",
  projectName: "Jakarta AI Campus · Phase 1",
  geography: "Indonesia",
  targetMW: 19.2,
  plannedNoticeToProceed: "2026-06-15",
  permitComplexity: 3,
  utilityQueueMonths: 8,
  longLeadTightness: 4,
  epcReadiness: 3,
  contingencyPct: 12,
};

export function M5SimulatorShell() {
  const searchParams = useSearchParams();
  const presetId = searchParams.get("preset");

  const [input, setInput] = useState<M5Input>(() => {
    if (presetId) {
      const p = getPreset(presetId);
      if (p && p.module === "m5") return p.input as M5Input;
    }
    return DEFAULT_INPUT;
  });

  const [tab, setTab] = useState(0);
  const output = useMemo(() => runM5(input), [input]);
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
              <Chip label="M5 · Build Tower" color="primary" size="small" sx={{ mb: 1 }} />
              <Typography variant="h4">
                {preset?.title ?? "How to build — commissioning and delivery risk"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {preset?.description ??
                  "Deterministic schedule and risk engine for permitting, utility energization, long-lead procurement, EPC execution, and commissioning."}
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <InputPanel value={input} onChange={setInput} />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
              <Tab label="Critical path" />
              <Tab label="Risk heatmap" />
              <Tab label="Project memo" />
              <Tab label="Build debate" />
            </Tabs>
            {tab === 0 && <CriticalPathView output={output} />}
            {tab === 1 && <RiskHeatmap output={output} />}
            {tab === 2 && <ProjectMemoView output={output} />}
            {tab === 3 && <BuildDebateStream output={output} presetId={presetId ?? undefined} />}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
