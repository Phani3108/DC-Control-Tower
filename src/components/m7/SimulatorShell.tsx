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
import { runM7 } from "@/lib/m7/engines";
import type { M7Input } from "@/lib/m7/types";
import { getPreset } from "@/data/presets";
import { InputPanel } from "./InputPanel";
import { PowerBalanceView } from "./PowerBalanceView";
import { GridRiskView } from "./GridRiskView";
import { PowerMemoView } from "./PowerMemoView";
import { PowerDebateStream } from "./PowerDebateStream";

const DEFAULT_INPUT: M7Input = {
  facilityId: "dxb-1",
  facilityName: "Dubai AI Campus · Block A",
  geography: "UAE",
  targetITMW: 72,
  pue: 1.27,
  utilityFeedMW: 86,
  onsiteGenerationMW: 18,
  batteryMWh: 56,
  spotPriceUSDPerMWh: 122,
  demandResponsePct: 11,
  contractMode: "hybrid-ppa-spot",
  reservePolicy: "N-1",
};

export function M7SimulatorShell() {
  const searchParams = useSearchParams();
  const presetId = searchParams.get("preset");

  const [input, setInput] = useState<M7Input>(() => {
    if (presetId) {
      const p = getPreset(presetId);
      if (p && p.module === "m7") return p.input as M7Input;
    }
    return DEFAULT_INPUT;
  });

  const [tab, setTab] = useState(0);
  const [ingestingLive, setIngestingLive] = useState(false);
  const [liveSignalState, setLiveSignalState] = useState<"live" | "stale" | "mock" | "error" | undefined>();
  const [liveSignalSummary, setLiveSignalSummary] = useState<string | undefined>();
  const output = useMemo(() => runM7(input), [input]);
  const preset = presetId ? getPreset(presetId) : undefined;

  const ingestLiveSignals = async () => {
    setIngestingLive(true);
    try {
      const res = await fetch("/api/connectors/m7/power-signals", { cache: "no-store" });
      const json = (await res.json()) as {
        ok: boolean;
        message?: string;
        envelope?: {
          utility: { state: "live" | "stale" | "mock"; utilityFeedMW: number; onsiteGenerationMW: number; source: string };
          market: { state: "live" | "stale" | "mock"; spotPriceUSDPerMWh: number; source: string };
          recommendedInputPatch: Pick<M7Input, "utilityFeedMW" | "onsiteGenerationMW" | "spotPriceUSDPerMWh">;
        };
      };

      if (!res.ok || !json.ok || !json.envelope) {
        setLiveSignalState("error");
        setLiveSignalSummary(json.message ?? "Connector ingestion failed");
        return;
      }

      const envelope = json.envelope;
      setInput((prev) => ({ ...prev, ...envelope.recommendedInputPatch }));

      setLiveSignalState(envelope.utility.state === "live" && envelope.market.state === "live" ? "live" : "mock");
      setLiveSignalSummary(
        `${envelope.utility.utilityFeedMW.toFixed(1)} MW utility · ${envelope.utility.onsiteGenerationMW.toFixed(1)} MW on-site · $${envelope.market.spotPriceUSDPerMWh.toFixed(2)}/MWh`,
      );
    } catch (error) {
      setLiveSignalState("error");
      setLiveSignalSummary(error instanceof Error ? error.message : "Connector ingestion failed");
    } finally {
      setIngestingLive(false);
    }
  };

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
              <Chip label="M7 · Power Balancing Copilot" color="primary" size="small" sx={{ mb: 1 }} />
              <Typography variant="h4">
                {preset?.title ?? "Grid-aware power dispatch and reserve orchestration"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {preset?.description ??
                  "Deterministic power dispatch model with reserve-policy and market-risk synthesis for high-load AI facilities."}
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <InputPanel
              value={input}
              onChange={setInput}
              onIngestLive={ingestLiveSignals}
              ingestingLive={ingestingLive}
              liveSignalState={liveSignalState}
              liveSignalSummary={liveSignalSummary}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
              <Tab label="Power balance" />
              <Tab label="Grid risk" />
              <Tab label="Power memo" />
              <Tab label="Agent debate" />
            </Tabs>
            {tab === 0 && <PowerBalanceView output={output} />}
            {tab === 1 && <GridRiskView output={output} />}
            {tab === 2 && <PowerMemoView output={output} />}
            {tab === 3 && <PowerDebateStream output={output} presetId={presetId ?? undefined} />}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
