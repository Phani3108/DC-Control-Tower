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
  { index: 1, time: "0:00", label: "M1 · SEA 500 MW site selection", href: "/m1-site-intelligence?preset=m1-sea-500mw", color: "#C9A66B" },
  { index: 2, time: "2:00", label: "M2 · 40 MW B200 RFP → proposal", href: "/m2-capacity-matcher?preset=m2-anthropic-b200-40mw", color: "#4F7CAC" },
  { index: 3, time: "5:30", label: "M3 · Zone B latency incident RCA", href: "/m3-ops-tower?preset=m3-zoneb-latency-0417", color: "#EF6A6A" },
  { index: 4, time: "7:30", label: "M4 · KSA fintech + EU data routing", href: "/m4-sovereignty?preset=m4-ksa-fintech-eu-data", color: "#4ADE80" },
];

export function DemoStepper() {
  return (
    <Box component="section" id="demo" sx={{ py: { xs: 8, md: 12 }, bgcolor: "rgba(255,255,255,0.015)" }}>
      <Container maxWidth="xl">
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#4ADE80" }} />
          <Typography variant="overline" color="text.secondary">10-minute interview walkthrough</Typography>
        </Stack>
        <Typography
          variant="h3"
          sx={{ fontSize: { xs: "1.75rem", md: "2.25rem" }, fontWeight: 700, mb: 1.5, letterSpacing: "-0.02em" }}
        >
          Four presets. Zero live typing.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 5, maxWidth: 620 }}>
          Every scenario is URL-routable and disk-cached for replayable demos. Open a preset, watch the engines compute, export the brief.
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
