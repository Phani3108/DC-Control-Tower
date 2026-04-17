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
import { runM2 } from "@/lib/m2/engines";
import type { M2Input, M2Workload } from "@/lib/m2/types";
import { getPreset } from "@/data/presets";
import { InputPanel } from "./InputPanel";
import { RFPExtractor } from "./RFPExtractor";
import { FacilityFitView } from "./FacilityFitView";
import { CostBreakdownView } from "./CostBreakdownView";
import { ComparisonTable } from "./ComparisonTable";
import { ProposalStream, type ProposalSynthesis } from "./ProposalStream";
import { ProposalView } from "./ProposalView";

const DEFAULT_WORKLOAD: M2Workload = {
  shape: "training",
  gpu: "B200",
  clusterMW: 40,
  latencySLAms: 20,
  customerGeography: "US",
  dataGeography: "US",
  sustainability: { pueMax: 1.35, renewableMin: 0.6 },
  budgetUSDPerMWhMax: 140,
};

export function M2SimulatorShell() {
  const searchParams = useSearchParams();
  const presetId = searchParams.get("preset");

  const preset = presetId ? getPreset(presetId) : undefined;
  const presetInput = preset && preset.module === "m2" ? (preset.input as M2Input) : undefined;

  const [workload, setWorkload] = useState<M2Workload>(presetInput?.workload ?? DEFAULT_WORKLOAD);
  const [rfpText] = useState(presetInput?.rfpText ?? "");
  const [synthesis, setSynthesis] = useState<ProposalSynthesis | null>(null);
  const [tab, setTab] = useState(0);

  const input: M2Input = { workload, rfpText };
  const output = useMemo(() => runM2(input), [input]);

  const primary = output.fits.find((f) => f.facilityId === output.primaryFacilityId);
  const primaryCost = primary ? output.costs[primary.facilityId] : null;

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
              <Chip label="M2 · Capacity Matcher" color="primary" size="small" sx={{ mb: 1 }} />
              <Typography variant="h4">{preset?.title ?? "Match workload to DAMAC capacity"}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {preset?.description ??
                  "Paste an RFP or describe a workload; get ranked facility fit, 6-layer cost, SLA draft, competitor benchmarks, and an Opus-drafted proposal."}
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3}>
              <InputPanel value={workload} onChange={setWorkload} />
              <RFPExtractor initialText={rfpText} onExtracted={setWorkload} />
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
              <Tab label="Facility Fit" />
              <Tab label="Cost" />
              <Tab label="Benchmarks" />
              <Tab label="Proposal Writer" />
              <Tab label="Brief" />
            </Tabs>
            {tab === 0 && <FacilityFitView output={output} />}
            {tab === 1 && primary && primaryCost && (
              <CostBreakdownView facilityName={primary.facilityName} cost={primaryCost} />
            )}
            {tab === 2 && primaryCost && (
              <ComparisonTable comparisons={output.comparisons} damacUSDMWh={primaryCost.totalUSDPerMWh} />
            )}
            {tab === 3 && (
              <ProposalStream output={output} presetId={presetId ?? undefined} onSynthesis={setSynthesis} />
            )}
            {tab === 4 && <ProposalView output={output} synthesis={synthesis} />}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
