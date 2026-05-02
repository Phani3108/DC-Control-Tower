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
import { runM6 } from "@/lib/m6/engines";
import type { M6Input } from "@/lib/m6/types";
import { getPreset } from "@/data/presets";
import { InputPanel } from "./InputPanel";
import { CoolingEfficiencyView } from "./CoolingEfficiencyView";
import { ThermalRiskView } from "./ThermalRiskView";
import { CoolingMemoView } from "./CoolingMemoView";
import { CoolingDebateStream } from "./CoolingDebateStream";

const DEFAULT_INPUT: M6Input = {
  facilityId: "riyadh-1",
  facilityName: "Riyadh AI Campus · Pod C",
  geography: "Saudi Arabia",
  targetITMW: 64,
  ambientTempC: 38,
  humidityPct: 42,
  coolingMode: "hybrid-dlc",
  redundancyTier: "2N",
  rackDensityKW: 96,
  pueTarget: 1.26,
};

export function M6SimulatorShell() {
  const searchParams = useSearchParams();
  const presetId = searchParams.get("preset");

  const [input, setInput] = useState<M6Input>(() => {
    if (presetId) {
      const p = getPreset(presetId);
      if (p && p.module === "m6") return p.input as M6Input;
    }
    return DEFAULT_INPUT;
  });

  const [tab, setTab] = useState(0);
  const output = useMemo(() => runM6(input), [input]);
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
              <Chip label="M6 · Cooling Copilot" color="primary" size="small" sx={{ mb: 1 }} />
              <Typography variant="h4">
                {preset?.title ?? "Cooling control and PUE optimization"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {preset?.description ??
                  "Deterministic cooling model with zone-level setpoint planning and thermal-risk synthesis for high-density AI pods."}
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
              <Tab label="Cooling efficiency" />
              <Tab label="Thermal risk" />
              <Tab label="Cooling memo" />
              <Tab label="Agent debate" />
            </Tabs>
            {tab === 0 && <CoolingEfficiencyView output={output} />}
            {tab === 1 && <ThermalRiskView output={output} />}
            {tab === 2 && <CoolingMemoView output={output} />}
            {tab === 3 && <CoolingDebateStream output={output} presetId={presetId ?? undefined} />}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
