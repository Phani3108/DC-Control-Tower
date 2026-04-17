"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { motion } from "framer-motion";

export interface ModuleSectionProps {
  id: string;
  index: number;           // 1..4 for sequencing
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  href: string;
  presetHref: string;
  presetLabel: string;
  illustration: React.ReactNode;
  reverse?: boolean;
}

export function ModuleSection({
  id,
  index,
  eyebrow,
  title,
  description,
  bullets,
  href,
  presetHref,
  presetLabel,
  illustration,
  reverse = false,
}: ModuleSectionProps) {
  return (
    <Box
      component="section"
      id={id}
      sx={{
        py: { xs: 8, md: 12 },
        position: "relative",
        "&:not(:first-of-type)": {
          borderTop: "1px solid rgba(255,255,255,0.04)",
        },
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 6, md: 10 },
            alignItems: "center",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6 }}
            style={{ order: reverse ? 2 : 1 }}
          >
            <Chip
              label={eyebrow}
              size="small"
              sx={{
                mb: 3,
                bgcolor: "rgba(201,166,107,0.12)",
                color: "primary.light",
                border: "1px solid rgba(201,166,107,0.24)",
                fontWeight: 600,
                letterSpacing: "0.06em",
                fontSize: 11,
              }}
            />
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: "2rem", md: "2.5rem" },
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                fontWeight: 700,
                mb: 2.5,
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3, fontSize: "1.0625rem", lineHeight: 1.6 }}
            >
              {description}
            </Typography>

            <Stack spacing={1.2} sx={{ mb: 4 }}>
              {bullets.map((b) => (
                <Stack key={b} direction="row" spacing={1.2} alignItems="flex-start">
                  <CheckCircleIcon sx={{ color: "primary.main", fontSize: 20, mt: 0.25, flexShrink: 0 }} aria-hidden />
                  <Typography variant="body2" color="text.primary">
                    {b}
                  </Typography>
                </Stack>
              ))}
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                component={Link}
                href={href}
                variant="contained"
                color="primary"
                endIcon={<ArrowForwardIcon />}
              >
                Open module
              </Button>
              <Button
                component={Link}
                href={presetHref}
                variant="outlined"
                color="inherit"
                sx={{ borderColor: "rgba(255,255,255,0.18)" }}
              >
                {presetLabel}
              </Button>
            </Stack>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{ order: reverse ? 1 : 2 }}
          >
            {illustration}
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
}
