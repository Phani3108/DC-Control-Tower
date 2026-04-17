import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["@mui/material", "@mui/icons-material", "recharts"],
  },
  // Note: /api/agents/[...path]/route.ts handles the agent proxy with SSE support.
  // We do not use next.rewrites() here because SSE streaming works better through
  // a Route Handler that can forward ReadableStream.
};

export default nextConfig;
