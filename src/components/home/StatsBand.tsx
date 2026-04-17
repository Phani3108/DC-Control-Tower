"use client";

import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { motion, useInView } from "framer-motion";
import { shortLabel } from "@/lib/shared/citations";

interface Stat {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  cite_id: string;
  kind?: "integer" | "decimal";
}

const STATS: Stat[] = [
  { label: "MW planned", value: 4000, suffix: "+", cite_id: "damac-press-2025-jun" },
  { label: "MW operational (2026)", value: 300, suffix: "+", cite_id: "damac-press-2025-jun" },
  { label: "Countries", value: 12, cite_id: "damac-press-2025-jun" },
  { label: "US capacity secured", value: 12, prefix: "$", suffix: "B", cite_id: "damac-press-us-12b" },
  { label: "Jakarta AI DC investment", value: 2.3, prefix: "$", suffix: "B", kind: "decimal", cite_id: "damac-press-jakarta-2b" },
  { label: "LEAP 2025 pipeline", value: 500, suffix: " MW", cite_id: "damac-leap-ksa-500mw" },
];

function Counter({ to, suffix, prefix, kind }: { to: number; suffix?: string; prefix?: string; kind?: "integer" | "decimal" }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(to * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);

  const formatted = kind === "decimal" ? value.toFixed(1) : Math.floor(value).toLocaleString();
  return (
    <span ref={ref}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

export function StatsBand() {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 6, md: 10 },
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        bgcolor: "rgba(255,255,255,0.015)",
      }}
    >
      <Container maxWidth="xl">
        <Typography variant="overline" color="text.secondary" sx={{ mb: 3, display: "block" }}>
          DAMAC Digital · 2025–2026 public footprint
        </Typography>
        <Grid container spacing={3}>
          {STATS.map((s, i) => (
            <Grid key={s.label} size={{ xs: 6, md: 4, lg: 2 }}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
              >
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                  <Typography
                    variant="h3"
                    sx={{
                      color: "primary.light",
                      fontWeight: 700,
                      fontSize: { xs: "1.75rem", md: "2.25rem" },
                      lineHeight: 1.1,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    <Counter to={s.value} suffix={s.suffix} prefix={s.prefix} kind={s.kind} />
                  </Typography>
                  <Tooltip
                    arrow
                    title={`Source: ${shortLabel(s.cite_id)}`}
                    placement="top"
                  >
                    <InfoOutlinedIcon
                      sx={{
                        fontSize: 14,
                        color: "text.secondary",
                        mt: 0.5,
                        cursor: "help",
                      }}
                      aria-label={`Source for ${s.label}`}
                    />
                  </Tooltip>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  {s.label}
                </Typography>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
