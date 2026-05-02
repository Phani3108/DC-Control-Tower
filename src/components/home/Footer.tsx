"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import GitHubIcon from "@mui/icons-material/GitHub";
import { Logo } from "@/components/brand/Logo";
import { HealthBadge } from "@/components/shared/HealthBadge";

export function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        mt: 10,
        py: 6,
        borderTop: "1px solid rgba(255,255,255,0.06)",
        bgcolor: "rgba(255,255,255,0.015)",
      }}
    >
      <Container maxWidth="xl">
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={4}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
        >
          <Stack spacing={1.5}>
            <Logo variant="full" size="sm" />
            <Typography variant="caption" color="text.secondary">
              Built as an AI Head interview artefact for DAMAC Digital · MIT licensed
            </Typography>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 2, sm: 4 }} alignItems={{ xs: "flex-start", sm: "center" }}>
            <HealthBadge />
            <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />
            <Stack direction="row" spacing={2}>
              <Link
                href="https://github.com/Phani3108/DC-Control-Tower"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "inherit", textDecoration: "none" }}
                aria-label="GitHub repository"
              >
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <GitHubIcon fontSize="small" />
                  <Typography variant="caption" color="text.secondary">
                    GitHub
                  </Typography>
                </Stack>
              </Link>
              <Typography
                component={Link}
                href="/citations"
                variant="caption"
                color="text.secondary"
                sx={{ textDecoration: "none", "&:hover": { color: "primary.light" } }}
              >
                Citations
              </Typography>
              <Typography
                component={Link}
                href="/integrations"
                variant="caption"
                color="text.secondary"
                sx={{ textDecoration: "none", "&:hover": { color: "primary.light" } }}
              >
                Integrations
              </Typography>
              <Typography
                component={Link}
                href="/developer-guide"
                variant="caption"
                color="text.secondary"
                sx={{ textDecoration: "none", "&:hover": { color: "primary.light" } }}
              >
                Developer Guide
              </Typography>
              <Typography
                component={Link}
                href="/api-docs"
                variant="caption"
                color="text.secondary"
                sx={{ textDecoration: "none", "&:hover": { color: "primary.light" } }}
              >
                API Docs
              </Typography>
              <Typography
                component={Link}
                href="/#architecture"
                variant="caption"
                color="text.secondary"
                sx={{ textDecoration: "none", "&:hover": { color: "primary.light" } }}
              >
                Architecture
              </Typography>
            </Stack>
          </Stack>
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 4, display: "block", fontSize: 10.5 }}>
          Every number in this product is grounded in a public citation. Hover any figure to see the source.
          &nbsp;·&nbsp;
          © 2026 Phani Marupaka.
        </Typography>
      </Container>
    </Box>
  );
}
