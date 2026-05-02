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
import candidateSitesJson from "@/data/candidate-sites.json";
import { runAllEngines } from "@/lib/m1/engines";
import type { M1Input, M1Output } from "@/lib/m1/types";
import type { CandidateSite } from "@/lib/shared/types";
import { getPreset } from "@/data/presets";
import { InputPanel } from "./InputPanel";
import { SiteRanking } from "./SiteRanking";
import { ScorecardRadar } from "./ScorecardRadar";
import { TCOChart } from "./TCOChart";
import { DebateStream, type SynthesisResult } from "./DebateStream";
import { ICMemoView } from "./ICMemoView";

// JSON types number[] not [number, number]; double-cast to runtime truth.
const ALL_SITES = (candidateSitesJson as unknown as { sites: CandidateSite[] }).sites;

const DEFAULT_INPUT: M1Input = {
  targetMW: 500,
  region: "APAC",
  workloadProfile: "hyperscale-training",
  candidateSiteIds: ALL_SITES.map((s) => s.id),
};

export function M1SimulatorShell() {
  const searchParams = useSearchParams();
  const presetId = searchParams.get("preset");

  const [input, setInput] = useState<M1Input>(() => {
    if (presetId) {
      const p = getPreset(presetId);
      if (p && p.module === "m1") return p.input as M1Input;
    }
    return DEFAULT_INPUT;
  });

  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [synthesis, setSynthesis] = useState<SynthesisResult | null>(null);
  const [tab, setTab] = useState(0);

  // Deterministic TS-side computation — re-runs on any input change
  const output: M1Output = useMemo(() => runAllEngines(input), [input]);

  const activeSelectedSiteId =
    selectedSiteId && output.scorecards.find((c) => c.site.id === selectedSiteId)
      ? selectedSiteId
      : output.topSite || null;

  const selectedCard = output.scorecards.find((c) => c.site.id === activeSelectedSiteId) ?? null;
  const preset = presetId ? getPreset(presetId) : undefined;

  return (
    <Box sx={{ pb: 8 }}>
      {/* Sub-header */}
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
              <Chip label="M1 · Site Intelligence" color="primary" size="small" sx={{ mb: 1 }} />
              <Typography variant="h4">{preset?.title ?? "Site selection co-pilot"}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {preset?.description ??
                  "Multi-agent scoring across 10 dimensions — power, cost, cooling, latency, sovereignty, seismic, incentives, talent, finance risk, hyperscaler proximity."}
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          {/* Left column — inputs + ranking */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3}>
              <InputPanel value={input} onChange={setInput} sites={ALL_SITES} />
              <SiteRanking
                output={output}
                selectedSiteId={activeSelectedSiteId}
                onSelect={setSelectedSiteId}
              />
            </Stack>
          </Grid>

          {/* Right column — results */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
              <Tab label="Scorecard" />
              <Tab label="TCO" />
              <Tab label="Agent Debate" />
              <Tab label="IC Memo" />
            </Tabs>

            {tab === 0 && <ScorecardRadar card={selectedCard} />}
            {tab === 1 && <TCOChart output={output} />}
            {tab === 2 && (
              <DebateStream
                input={input}
                output={output}
                presetId={presetId ?? undefined}
                onSynthesis={setSynthesis}
              />
            )}
            {tab === 3 && <ICMemoView output={output} synthesis={synthesis} />}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
