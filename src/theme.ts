"use client";

import { createTheme } from "@mui/material/styles";

/**
 * DC Control Tower theme.
 *
 * Palette leans on DAMAC's existing brand colorway (muted desert ochre + deep
 * navy) but tuned for an ops/analytics UI: high contrast on dark chrome,
 * amber accents for action, muted neutrals for data surfaces.
 */
export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#C9A66B",        // DAMAC ochre
      light: "#E5C38F",
      dark: "#8F7440",
      contrastText: "#0B0F14",
    },
    secondary: {
      main: "#4F7CAC",        // steel blue (infra chrome)
      light: "#7FA4CE",
      dark: "#2E5380",
    },
    background: {
      default: "#0B0F14",     // near-black (control tower chrome)
      paper: "#141A23",
    },
    text: {
      primary: "#E8EEF5",
      secondary: "#9AA7B5",
    },
    success: { main: "#4ADE80" },
    warning: { main: "#F4B740" },
    error: { main: "#EF6A6A" },
    info: { main: "#60A5FA" },
  },
  typography: {
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 700, letterSpacing: "-0.02em" },
    h2: { fontWeight: 700, letterSpacing: "-0.01em" },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "*::-webkit-scrollbar": { width: 8, height: 8 },
        "*::-webkit-scrollbar-thumb": { background: "#2A3340", borderRadius: 4 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
  },
});
