"use client";

import { useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { KnowledgeGraphView } from "./KnowledgeGraphView";
import { AgentRegistryView } from "./AgentRegistryView";
import { GovernanceView } from "./GovernanceView";

export function PlatformShell() {
  const [tab, setTab] = useState(0);

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
              <Chip label="Platform Layer" color="primary" size="small" sx={{ mb: 1 }} />
              <Typography variant="h4">Unified intelligence substrate for M1-M8</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Knowledge graph relationships, agent inventory, and governance telemetry in one operational plane.
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ pt: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Knowledge Graph" />
          <Tab label="Agent Registry" />
          <Tab label="Governance" />
        </Tabs>

        {tab === 0 && <KnowledgeGraphView />}
        {tab === 1 && <AgentRegistryView />}
        {tab === 2 && <GovernanceView />}
      </Container>
    </Box>
  );
}
