"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { motion } from "framer-motion";

interface Step {
  index: number;
  time: string;
  label: string;
  href: string;
  color: string;
}

const STEPS: Step[] = [
  { index: 1, time: "0:00", label: "M8 · Abu Dhabi 35 MW — tenant mix → revenue", href: "/m8-tenant-optimizer?preset=m8-abu-dhabi-35mw-tenants", color: "#4ADE80" },
  { index: 2, time: "1:30", label: "M2 · 40 MW B200 RFP → customer proposal", href: "/m2-capacity-matcher?preset=m2-anthropic-b200-40mw", color: "#4ADE80" },
  { index: 3, time: "3:30", label: "M7 · Dubai 72 MW — dispatch + reserve margin", href: "/m7-power-balancer?preset=m7-dubai-72mw-power", color: "#C9A66B" },
  { index: 4, time: "5:00", label: "M6 · Riyadh 64 MW — PUE → opex savings", href: "/m6-cooling-copilot?preset=m6-riyadh-64mw-cooling", color: "#C9A66B" },
  { index: 5, time: "6:30", label: "M1 · SEA 500 MW — site selection → 5-yr TCO", href: "/m1-site-intelligence?preset=m1-sea-500mw", color: "#60A5FA" },
  { index: 6, time: "8:00", label: "M5 · Jakarta 19 MW — schedule → time-to-revenue", href: "/m5-build-tower?preset=m5-jakarta-19mw-phase1", color: "#60A5FA" },
  { index: 7, time: "9:30", label: "M3 · Zone B latency — RCA → SLA protection", href: "/m3-ops-tower?preset=m3-zoneb-latency-0417", color: "#EF6A6A" },
  { index: 8, time: "11:00", label: "M4 · KSA fintech + EU data — sovereignty unblock", href: "/m4-sovereignty?preset=m4-ksa-fintech-eu-data", color: "#EF6A6A" },
];

export function DemoStepper() {
  return (
    <Box component="section" id="demo" sx={{ py: { xs: 8, md: 12 }, bgcolor: "rgba(255,255,255,0.015)" }}>
      <Container maxWidth="xl">
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#4ADE80" }} />
          <Typography variant="overline" color="text.secondary">12-minute boardroom walkthrough</Typography>
        </Stack>
        <Typography
          variant="h3"
          sx={{ fontSize: { xs: "1.75rem", md: "2.25rem" }, fontWeight: 700, mb: 1.5, letterSpacing: "-0.02em" }}
        >
          Eight presets, sequenced by P&amp;L. Zero live typing.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 5, maxWidth: 680 }}>
          Open in order: revenue → margin → velocity → risk. Every preset is URL-routable, disk-cached, and replayable offline — demos never break, even with no FastAPI backend reachable.
        </Typography>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          {STEPS.map((s, i) => (
            <motion.div
              key={s.index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              style={{ flex: 1 }}
            >
              <Box
                component={Link}
                href={s.href}
                sx={{
                  display: "block",
                  p: 3,
                  height: "100%",
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderLeft: `3px solid ${s.color}`,
                  textDecoration: "none",
                  transition: "all 0.15s",
                  "&:hover": {
                    borderColor: s.color,
                    transform: "translateY(-2px)",
                    bgcolor: "rgba(255,255,255,0.04)",
                  },
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                  <Chip label={s.time} size="small" sx={{ bgcolor: `${s.color}22`, color: s.color, fontFamily: "monospace", height: 20 }} />
                  <Typography variant="caption" color="text.secondary">
                    Step {s.index}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: "text.primary", mb: 1.5, fontWeight: 500 }}>
                  {s.label}
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography variant="caption" sx={{ color: s.color, fontWeight: 600, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.08em" }}>
                    Launch preset
                  </Typography>
                  <ArrowForwardIcon sx={{ fontSize: 14, color: s.color }} aria-hidden />
                </Stack>
              </Box>
            </motion.div>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
