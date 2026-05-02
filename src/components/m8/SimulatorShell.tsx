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
import { runM8 } from "@/lib/m8/engines";
import type { M8Input } from "@/lib/m8/types";
import { getPreset } from "@/data/presets";
import { InputPanel } from "./InputPanel";
import { TenantFitView } from "./TenantFitView";
import { RevenueView } from "./RevenueView";
import { TenantMemoView } from "./TenantMemoView";
import { TenantDebateStream } from "./TenantDebateStream";

const DEFAULT_INPUT: M8Input = {
  facilityId: "auh-1",
  facilityName: "Abu Dhabi AI Campus · Zone 2",
  geography: "UAE",
  availableMW: 48,
  committedMW: 13,
  targetGpu: "B200",
  pue: 1.24,
  pricingMode: "hybrid",
  contractTermYears: 5,
  renewablePremiumPct: 7,
  financingCostPct: 9.5,
  targetGrossMarginPct: 38,
};

export function M8SimulatorShell() {
  const searchParams = useSearchParams();
  const presetId = searchParams.get("preset");

  const [input, setInput] = useState<M8Input>(() => {
    if (presetId) {
      const p = getPreset(presetId);
      if (p && p.module === "m8") return p.input as M8Input;
    }
    return DEFAULT_INPUT;
  });

  const [tab, setTab] = useState(0);
  const output = useMemo(() => runM8(input), [input]);
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
              <Chip label="M8 · Tenant Fit and Revenue Optimizer" color="primary" size="small" sx={{ mb: 1 }} />
              <Typography variant="h4">
                {preset?.title ?? "Tenant portfolio fit and revenue optimization"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {preset?.description ??
                  "Deterministic commercialization model for tenant archetype fit, price structure, margin quality, and payback outlook."}
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
              <Tab label="Tenant fit" />
              <Tab label="Revenue stack" />
              <Tab label="Commercial memo" />
              <Tab label="Agent debate" />
            </Tabs>
            {tab === 0 && <TenantFitView output={output} />}
            {tab === 1 && <RevenueView output={output} />}
            {tab === 2 && <TenantMemoView output={output} />}
            {tab === 3 && <TenantDebateStream output={output} presetId={presetId ?? undefined} />}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
