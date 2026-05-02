"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { motion } from "framer-motion";

interface Lever {
  tier: "REVENUE" | "MARGIN" | "VELOCITY" | "RISK";
  color: string;
  bg: string;
  modules: string;
  headline: string;
  detail: string;
}

const LEVERS: Lever[] = [
  {
    tier: "REVENUE",
    color: "#4ADE80",
    bg: "rgba(74,222,128,0.12)",
    modules: "M8 · M2",
    headline: "Faster capacity → contract conversion",
    detail:
      "Tenant-mix optimisation and minute-scale RFP-to-proposal workflows turn idle MW into signed contracts.",
  },
  {
    tier: "MARGIN",
    color: "#C9A66B",
    bg: "rgba(201,166,107,0.14)",
    modules: "M7 · M6",
    headline: "Energy is 30–45% of opex — defended every dispatch",
    detail:
      "Power balancing and PUE optimisation hold gross margin against grid volatility and dense GPU thermals.",
  },
  {
    tier: "VELOCITY",
    color: "#60A5FA",
    bg: "rgba(96,165,250,0.14)",
    modules: "M1 · M5",
    headline: "Right site, on schedule — capital compounds",
    detail:
      "Site selection swings 5-yr TCO by ~25%; build orchestration converts schedule pull-in into earlier revenue.",
  },
  {
    tier: "RISK",
    color: "#EF6A6A",
    bg: "rgba(239,106,106,0.14)",
    modules: "M3 · M4",
    headline: "Outages and sovereignty failures kill deals",
    detail:
      "Sub-minute incident triage and auditable jurisdictional routing protect SLA credits and unblock cross-border contracts.",
  },
];

export function ValueAtStakeBand() {
  return (
    <Box
      component="section"
      id="value"
      sx={{
        py: { xs: 8, md: 12 },
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.015) 0%, transparent 100%)",
      }}
    >
      <Container maxWidth="xl">
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "primary.light" }} />
          <Typography variant="overline" color="text.secondary">
            Value at stake · per gigawatt of AI capacity
          </Typography>
        </Stack>
        <Typography
          variant="h3"
          sx={{
            fontSize: { xs: "1.75rem", md: "2.25rem" },
            fontWeight: 700,
            mb: 1.5,
            letterSpacing: "-0.02em",
            maxWidth: 820,
          }}
        >
          Four levers move the P&amp;L. Eight modules pull them every day.
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 5, maxWidth: 720, fontSize: "1.0625rem", lineHeight: 1.6 }}
        >
          Modules are sequenced below by P&amp;L impact — revenue first, risk last — so leadership reviews
          start with the dollar and end with the audit trail.
        </Typography>

        <Grid container spacing={2.5}>
          {LEVERS.map((l, i) => (
            <Grid key={l.tier} size={{ xs: 12, sm: 6, lg: 3 }}>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
              >
                <Box
                  sx={{
                    p: 3,
                    height: "100%",
                    borderRadius: 2,
                    bgcolor: l.bg,
                    border: `1px solid ${l.color}33`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.25,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Chip
                      label={l.tier}
                      size="small"
                      sx={{
                        bgcolor: `${l.color}22`,
                        color: l.color,
                        border: `1px solid ${l.color}55`,
                        fontWeight: 700,
                        fontSize: 10,
                        letterSpacing: "0.1em",
                        height: 22,
                      }}
                    />
                    <Typography variant="caption" sx={{ color: l.color, fontWeight: 700, fontFamily: "monospace" }}>
                      {l.modules}
                    </Typography>
                  </Stack>
                  <Typography variant="h6" sx={{ fontSize: "1.05rem", fontWeight: 600, lineHeight: 1.3, color: "text.primary" }}>
                    {l.headline}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                    {l.detail}
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
