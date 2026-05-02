"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArchitectureIcon from "@mui/icons-material/Architecture";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

/**
 * Hero — crosslinq-style full-bleed 100vh with parallax isometric DC SVG.
 * Respects prefers-reduced-motion by skipping parallax transforms.
 */
export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [0, -80]);
  const imgY = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [0, 40]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0.2]);

  return (
    <Box
      ref={ref}
      component="section"
      sx={{
        position: "relative",
        minHeight: { xs: "auto", md: "100vh" },
        display: "flex",
        alignItems: "center",
        pt: { xs: 10, md: 12 },
        pb: { xs: 8, md: 10 },
        overflow: "hidden",
        bgcolor: "background.default",
        backgroundImage: `
          radial-gradient(1200px 500px at 10% -10%, rgba(201,166,107,0.22), transparent 60%),
          radial-gradient(900px 400px at 90% 10%, rgba(79,124,172,0.25), transparent 60%),
          radial-gradient(700px 350px at 50% 120%, rgba(74,222,128,0.1), transparent 60%)
        `,
      }}
    >
      {/* Grid overlay */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, #000, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, #000, transparent 80%)",
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="xl" sx={{ position: "relative" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 6, md: 8 },
            alignItems: "center",
          }}
        >
          {/* Left: copy */}
          <motion.div style={{ y, opacity: fade }}>
            <Chip
              label="DAMAC Digital · AI Command Center"
              size="small"
              sx={{
                mb: 3,
                bgcolor: "rgba(201,166,107,0.14)",
                color: "primary.light",
                border: "1px solid rgba(201,166,107,0.3)",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                fontSize: 11,
              }}
            />
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "2.5rem", sm: "3.25rem", md: "4rem" },
                lineHeight: 1.02,
                letterSpacing: "-0.03em",
                fontWeight: 700,
                mb: 3,
                background:
                  "linear-gradient(135deg, #E8EEF5 0%, #C9A66B 50%, #E8EEF5 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Monetise every megawatt. Defend every margin point.
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: "text.secondary",
                mb: 4,
                fontWeight: 400,
                textTransform: "none",
                letterSpacing: 0,
                fontSize: { xs: "1rem", md: "1.125rem" },
                maxWidth: 560,
              }}
            >
              The control tower for 4,000 MW of AI-ready capacity. Eight modules sequenced by P&amp;L impact — tenant revenue, energy margin, capital velocity, operational risk — every number cited, every decision auditable.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                component={Link}
                href="/m8-tenant-optimizer?preset=m8-abu-dhabi-35mw-tenants"
                variant="contained"
                color="primary"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  py: 1.5,
                  px: 3,
                  fontSize: "1rem",
                  boxShadow: "0 6px 20px rgba(201,166,107,0.35)",
                  "&:hover": {
                    boxShadow: "0 8px 28px rgba(201,166,107,0.5)",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                See the revenue lever
              </Button>
              <Button
                component={Link}
                href="/platform"
                variant="outlined"
                color="inherit"
                size="large"
                startIcon={<ArchitectureIcon />}
                sx={{
                  py: 1.5,
                  px: 3,
                  fontSize: "1rem",
                  borderColor: "rgba(255,255,255,0.18)",
                  "&:hover": { borderColor: "primary.light" },
                }}
              >
                Platform layer
              </Button>
            </Stack>

            <Stack direction="row" spacing={2} sx={{ mt: 5, flexWrap: "wrap", gap: 1 }}>
              {["P&L-first sequencing", "Every number cited", "SSE multi-agent", "Enterprise-ready"].map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.04)",
                    color: "text.secondary",
                    border: "1px solid rgba(255,255,255,0.08)",
                    fontSize: 11,
                  }}
                />
              ))}
            </Stack>
          </motion.div>

          {/* Right: isometric DC */}
          <motion.div
            style={{ y: imgY }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <Box
              sx={{
                position: "relative",
                aspectRatio: "800 / 520",
                width: "100%",
                maxWidth: 700,
                mx: "auto",
                filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.5))",
              }}
            >
              <Image
                src="/brand/hero/datacenter-iso.svg"
                alt="Isometric illustration of an AI-ready data center with racks, cooling loops, and grid feed"
                fill
                priority
                style={{ objectFit: "contain" }}
              />
            </Box>
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
}
