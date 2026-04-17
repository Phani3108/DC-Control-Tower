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
import damacJson from "@/data/damac-facilities.json";
import { runM4 } from "@/lib/m4/engines";
import type { M4Input } from "@/lib/m4/types";
import type { DAMACFacility } from "@/lib/shared/types";
import { getPreset } from "@/data/presets";
import { InputPanel } from "./InputPanel";
import { AssessmentGrid } from "./AssessmentGrid";
import { RoutingView } from "./RoutingView";
import { ComplianceStream, type ComplianceSynthesis } from "./ComplianceStream";
import { BriefView } from "./BriefView";

const ALL_FACILITIES = (damacJson as unknown as { facilities: DAMACFacility[] }).facilities;

const DEFAULT_INPUT: M4Input = {
  workloadCategory: "fintech-inference",
  customerDataCountries: ["ES", "GR", "DE"],
  candidateFacilityIds: ALL_FACILITIES.map((f) => f.id),
};

export function M4SimulatorShell() {
  const searchParams = useSearchParams();
  const presetId = searchParams.get("preset");

  const [input, setInput] = useState<M4Input>(() => {
    if (presetId) {
      const p = getPreset(presetId);
      if (p && p.module === "m4") return p.input as M4Input;
    }
    return DEFAULT_INPUT;
  });

  const [synthesis, setSynthesis] = useState<ComplianceSynthesis | null>(null);
  const [tab, setTab] = useState(0);

  const output = useMemo(() => runM4(input), [input]);
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
              <Chip label="M4 · Sovereignty Grid" color="primary" size="small" sx={{ mb: 1 }} />
              <Typography variant="h4">{preset?.title ?? "Where can this workload legally run?"}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {preset?.description ??
                  "Multi-jurisdiction compliance routing. Deterministic classifier + multi-agent reasoning with cite_id-only citations."}
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3}>
              <InputPanel value={input} onChange={setInput} facilities={ALL_FACILITIES} />
              <RoutingView output={output} />
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
              <Tab label="Jurisdictions" />
              <Tab label="Compliance Reasoning" />
              <Tab label="Brief" />
            </Tabs>
            {tab === 0 && <AssessmentGrid output={output} />}
            {tab === 1 && (
              <ComplianceStream output={output} presetId={presetId ?? undefined} onSynthesis={setSynthesis} />
            )}
            {tab === 2 && <BriefView output={output} synthesis={synthesis} />}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
