"use client";

import Image from "next/image";
import Link from "next/link";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

interface Props {
  variant?: "full" | "mark";
  size?: "sm" | "md" | "lg";
  href?: string;
}

const SIZE: Record<NonNullable<Props["size"]>, { full: [number, number]; mark: [number, number] }> = {
  sm: { full: [180, 36], mark: [28, 28] },
  md: { full: [240, 48], mark: [36, 36] },
  lg: { full: [320, 64], mark: [48, 48] },
};

/**
 * DC Control Tower logo — inline SVG rendered from /public/brand/.
 * The "C" of Control becomes a stylized 4-bar tower + pulse dot.
 */
export function Logo({ variant = "full", size = "md", href = "/" }: Props) {
  const theme = useTheme();
  const mode = theme.palette.mode;
  const src = `/brand/logo-${variant}-${mode === "light" ? "dark" : "light"}.svg`;
  const [w, h] = SIZE[size][variant];

  const img = (
    <Image
      src={src}
      alt="DC Control Tower"
      width={w}
      height={h}
      priority
      style={{ display: "block", height: "auto" }}
    />
  );

  if (!href) {
    return <Box aria-label="DC Control Tower">{img}</Box>;
  }
  return (
    <Box
      component={Link}
      href={href}
      aria-label="DC Control Tower — home"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        textDecoration: "none",
        transition: "opacity 0.15s",
        "&:hover": { opacity: 0.82 },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.light",
          outlineOffset: 4,
          borderRadius: 2,
        },
      }}
    >
      {img}
    </Box>
  );
}
