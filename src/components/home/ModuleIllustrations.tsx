"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

/**
 * Simple SVG-first module illustrations — fast to render, crisp at any zoom,
 * no external asset dependency. Each one is a data-center-themed mini-dashboard
 * that hints at what the module looks like without requiring a full render.
 */

const Frame: React.FC<React.PropsWithChildren<{ title: string; accent?: string }>> = ({
  title,
  accent = "#C9A66B",
  children,
}) => (
  <Box
    sx={{
      position: "relative",
      aspectRatio: "16 / 11",
      width: "100%",
      borderRadius: 2,
      p: 2.5,
      bgcolor: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.08)",
      overflow: "hidden",
    }}
  >
    <Stack direction="row" spacing={0.5} sx={{ mb: 2 }}>
      <Box sx={{ width: 8, height: 8, bgcolor: "#EF6A6A", borderRadius: "50%" }} />
      <Box sx={{ width: 8, height: 8, bgcolor: "#F4B740", borderRadius: "50%" }} />
      <Box sx={{ width: 8, height: 8, bgcolor: "#4ADE80", borderRadius: "50%" }} />
      <Typography
        variant="caption"
        sx={{ ml: 2, color: "text.secondary", fontFamily: "monospace", fontSize: 10, letterSpacing: "0.06em" }}
      >
        {title}
      </Typography>
    </Stack>
    <Box sx={{ position: "relative", height: "calc(100% - 32px)" }}>{children}</Box>
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: -20,
        background: `radial-gradient(400px 200px at 80% 20%, ${accent}33, transparent 70%)`,
        pointerEvents: "none",
      }}
    />
  </Box>
);

export function M1Illustration() {
  return (
    <Frame title="/m1-site-intelligence?preset=m1-sea-500mw" accent="#C9A66B">
      <svg viewBox="0 0 400 240" width="100%" height="100%">
        {/* Radar skeleton */}
        <g transform="translate(120,120)" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1">
          {[20, 40, 60, 80, 100].map((r) => (
            <circle key={r} cx="0" cy="0" r={r} />
          ))}
          {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg) => (
            <line
              key={deg}
              x1="0"
              y1="0"
              x2={100 * Math.cos((deg * Math.PI) / 180)}
              y2={100 * Math.sin((deg * Math.PI) / 180)}
            />
          ))}
          {/* Radar polygon */}
          <polygon
            points="82,0 65,47 -20,62 -70,51 -92,-30 -56,-81 15,-95 74,-53 82,0 60,30"
            fill="rgba(201,166,107,0.25)"
            stroke="#C9A66B"
            strokeWidth="1.5"
          />
        </g>
        {/* Ranking bars */}
        <g transform="translate(250,30)">
          {[
            { name: "Johor", w: 170, fill: "#C9A66B" },
            { name: "Jakarta-ext", w: 140, fill: "#4F7CAC" },
            { name: "Bangkok", w: 108, fill: "#2A3340" },
            { name: "Batam", w: 88, fill: "#2A3340" },
          ].map((r, i) => (
            <g key={r.name} transform={`translate(0,${i * 40})`}>
              <text x="0" y="12" fontSize="9" fill="#9AA7B5" fontFamily="monospace">
                {i + 1}. {r.name}
              </text>
              <rect x="0" y="18" width="180" height="6" fill="rgba(255,255,255,0.05)" rx="2" />
              <rect x="0" y="18" width={r.w} height="6" fill={r.fill} rx="2" />
            </g>
          ))}
        </g>
      </svg>
    </Frame>
  );
}

export function M2Illustration() {
  return (
    <Frame title="/m2-capacity-matcher" accent="#4F7CAC">
      <svg viewBox="0 0 400 240" width="100%" height="100%">
        <g transform="translate(20,30)">
          <text x="0" y="0" fontSize="10" fill="#9AA7B5" fontFamily="monospace">
            COST / MWh BREAKDOWN
          </text>
          {[
            { label: "power", w: 140, c: "#C9A66B" },
            { label: "cooling", w: 60, c: "#60A5FA" },
            { label: "gpu amort", w: 120, c: "#F4B740" },
            { label: "real estate", w: 40, c: "#4ADE80" },
            { label: "network", w: 20, c: "#4F7CAC" },
            { label: "staff / ops", w: 50, c: "#EF6A6A" },
          ].map((l, i) => {
            let xAcc = 0;
            for (let k = 0; k < i; k++) {
              xAcc += [140, 60, 120, 40, 20][k] ?? 0;
            }
            return <rect key={l.label} x={xAcc} y="16" height="18" width={l.w} fill={l.c} rx="3" />;
          })}
        </g>
        <g transform="translate(20,90)">
          {[
            { site: "Virginia Loudoun", fit: 92 },
            { site: "Texas Abilene", fit: 84 },
            { site: "Madrid Alcalá", fit: 71 },
          ].map((r, i) => (
            <g key={r.site} transform={`translate(0,${i * 40})`}>
              <text x="0" y="12" fontSize="9" fill="#E8EEF5" fontFamily="monospace">
                {r.site}
              </text>
              <rect x="0" y="18" width="340" height="5" fill="rgba(255,255,255,0.05)" rx="2" />
              <rect x="0" y="18" width={r.fit * 3.4} height="5" fill="#C9A66B" rx="2" />
              <text x="350" y="22" fontSize="9" fill="#C9A66B" fontFamily="monospace" textAnchor="end">
                {r.fit}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </Frame>
  );
}

export function M3Illustration() {
  return (
    <Frame title="INC-2026-0417-01 · Zone B" accent="#EF6A6A">
      <svg viewBox="0 0 400 240" width="100%" height="100%">
        <g transform="translate(20,20)">
          <text x="0" y="0" fontSize="9" fill="#9AA7B5" fontFamily="monospace">
            p99 LATENCY (ms) · 90-min window
          </text>
          <polyline
            points="0,70 30,72 60,68 80,65 100,60 120,58 140,90 160,180 180,145 200,110 220,90 240,78 260,72 280,68 300,64 320,62 340,58 360,56"
            fill="none"
            stroke="#EF6A6A"
            strokeWidth="2"
          />
          <line x1="120" y1="10" x2="120" y2="170" stroke="#EF6A6A" strokeDasharray="3 3" strokeWidth="1" opacity="0.5" />
          <text x="124" y="18" fontSize="9" fill="#EF6A6A" fontFamily="monospace">
            04:17 · anomaly
          </text>
        </g>
        <g transform="translate(20,180)">
          {[
            { l: "Ops", c: "#60A5FA" },
            { l: "Infra", c: "#4F7CAC" },
            { l: "Risk", c: "#F4B740" },
            { l: "RCA synth", c: "#C9A66B" },
          ].map((a, i) => (
            <g key={a.l} transform={`translate(${i * 90},0)`}>
              <circle cx="0" cy="0" r="5" fill={a.c} />
              <text x="10" y="4" fontSize="9" fill="#9AA7B5" fontFamily="monospace">
                {a.l}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </Frame>
  );
}

export function M4Illustration() {
  return (
    <Frame title="KSA fintech · EU customer data" accent="#4ADE80">
      <svg viewBox="0 0 400 240" width="100%" height="100%">
        <g transform="translate(20,20)">
          {[
            { j: "UAE (PDPL)", verdict: "GATED", c: "#F4B740" },
            { j: "Saudi (PDPL+SDAIA)", verdict: "BLOCKED", c: "#EF6A6A" },
            { j: "Spain (EU AI Act)", verdict: "CLEAR", c: "#4ADE80" },
            { j: "Greece (EU AI Act)", verdict: "CLEAR", c: "#4ADE80" },
          ].map((r, i) => (
            <g key={r.j} transform={`translate(0,${i * 40})`}>
              <rect x="0" y="0" width="6" height="26" fill={r.c} rx="2" />
              <text x="14" y="12" fontSize="10" fill="#E8EEF5" fontFamily="monospace">
                {r.j}
              </text>
              <text x="14" y="24" fontSize="9" fill="#9AA7B5" fontFamily="monospace">
                severity: blocking / gating / informational
              </text>
              <rect x="320" y="2" width="44" height="18" fill={`${r.c}22`} stroke={r.c} strokeWidth="1" rx="2" />
              <text x="342" y="14" fontSize="9" fill={r.c} fontFamily="monospace" textAnchor="middle" fontWeight="600">
                {r.verdict}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </Frame>
  );
}

export function M5Illustration() {
  return (
    <Frame title="/m5-build-tower?preset=m5-jakarta-19mw-phase1" accent="#F4B740">
      <svg viewBox="0 0 400 240" width="100%" height="100%">
        <g transform="translate(20,24)">
          <text x="0" y="0" fontSize="9" fill="#9AA7B5" fontFamily="monospace">
            CRITICAL PATH · P50 vs P90 ENERGIZATION
          </text>
          <line x1="0" y1="18" x2="360" y2="18" stroke="rgba(255,255,255,0.08)" />
          <line x1="0" y1="76" x2="360" y2="76" stroke="rgba(255,255,255,0.08)" />
          <line x1="0" y1="134" x2="360" y2="134" stroke="rgba(255,255,255,0.08)" />
          <line x1="0" y1="192" x2="360" y2="192" stroke="rgba(255,255,255,0.08)" />

          <rect x="0" y="28" width="110" height="14" rx="2" fill="#4F7CAC" />
          <rect x="118" y="28" width="140" height="14" rx="2" fill="#C9A66B" />
          <rect x="0" y="86" width="150" height="14" rx="2" fill="#EF6A6A" />
          <rect x="160" y="86" width="120" height="14" rx="2" fill="#4ADE80" />
          <rect x="0" y="144" width="210" height="14" rx="2" fill="#F4B740" />

          <line x1="270" y1="16" x2="270" y2="210" stroke="#E8EEF5" strokeDasharray="3 3" />
          <line x1="328" y1="16" x2="328" y2="210" stroke="#F4B740" strokeDasharray="3 3" />
          <text x="270" y="226" fontSize="9" fill="#E8EEF5" fontFamily="monospace" textAnchor="middle">
            P50
          </text>
          <text x="328" y="226" fontSize="9" fill="#F4B740" fontFamily="monospace" textAnchor="middle">
            P90
          </text>
        </g>
      </svg>
    </Frame>
  );
}

export function M6Illustration() {
  return (
    <Frame title="/m6-cooling-copilot?preset=m6-riyadh-64mw-cooling" accent="#5CC7B2">
      <svg viewBox="0 0 400 240" width="100%" height="100%">
        <g transform="translate(20,22)">
          <text x="0" y="0" fontSize="9" fill="#9AA7B5" fontFamily="monospace">
            COOLING CONTROL · SETPOINT OPTIMIZATION
          </text>

          {[0, 1, 2].map((idx) => (
            <g key={idx} transform={`translate(0,${22 + idx * 58})`}>
              <rect x="0" y="0" width="360" height="36" rx="4" fill="rgba(255,255,255,0.03)" />
              <text x="10" y="14" fontSize="9" fill="#E8EEF5" fontFamily="monospace">{`Zone ${idx + 1}`}</text>
              <rect x="10" y="20" width={`${140 + idx * 45}`} height="7" rx="3" fill="#5CC7B2" />
              <rect x="168" y="20" width={`${110 + idx * 26}`} height="7" rx="3" fill="#4F7CAC" opacity="0.9" />
              <text x="318" y="14" fontSize="8" fill="#9AA7B5" fontFamily="monospace" textAnchor="end">
                {`PUE ${1.34 - idx * 0.03}`}
              </text>
            </g>
          ))}

          <line x1="292" y1="12" x2="292" y2="214" stroke="#5CC7B2" strokeDasharray="3 3" />
          <text x="292" y="228" fontSize="9" fill="#5CC7B2" fontFamily="monospace" textAnchor="middle">
            target PUE
          </text>
        </g>
      </svg>
    </Frame>
  );
}

export function M7Illustration() {
  return (
    <Frame title="/m7-power-balancer?preset=m7-dubai-72mw-power" accent="#60A5FA">
      <svg viewBox="0 0 400 240" width="100%" height="100%">
        <g transform="translate(20,20)">
          <text x="0" y="0" fontSize="9" fill="#9AA7B5" fontFamily="monospace">
            POWER DISPATCH · GRID + RESERVE ORCHESTRATION
          </text>

          {[0, 1, 2].map((idx) => (
            <g key={idx} transform={`translate(0,${24 + idx * 56})`}>
              <rect x="0" y="0" width="360" height="34" rx="4" fill="rgba(255,255,255,0.03)" />
              <text x="10" y="13" fontSize="9" fill="#E8EEF5" fontFamily="monospace">{`Window ${idx + 1}`}</text>
              <rect x="10" y="18" width={`${120 + idx * 34}`} height="6" rx="3" fill="#60A5FA" />
              <rect x="138" y="18" width={`${90 + idx * 22}`} height="6" rx="3" fill="#4ADE80" opacity="0.9" />
              <rect x="238" y="18" width={`${40 + idx * 18}`} height="6" rx="3" fill="#F4B740" opacity="0.9" />
              <text x="344" y="13" fontSize="8" fill="#9AA7B5" fontFamily="monospace" textAnchor="end">
                {`$${108 + idx * 7}/MWh`}
              </text>
            </g>
          ))}

          <line x1="300" y1="10" x2="300" y2="214" stroke="#60A5FA" strokeDasharray="3 3" />
          <text x="300" y="228" fontSize="9" fill="#60A5FA" fontFamily="monospace" textAnchor="middle">
            reserve floor
          </text>
        </g>
      </svg>
    </Frame>
  );
}

export function M8Illustration() {
  return (
    <Frame title="/m8-tenant-optimizer?preset=m8-abu-dhabi-35mw-tenants" accent="#E8792F">
      <svg viewBox="0 0 400 240" width="100%" height="100%">
        <g transform="translate(20,20)">
          <text x="0" y="0" fontSize="9" fill="#9AA7B5" fontFamily="monospace">
            TENANT MIX · REVENUE AND MARGIN ENVELOPE
          </text>

          {[
            { label: "Frontier training", fit: 91, rev: 128, color: "#E8792F" },
            { label: "Sovereign inference", fit: 87, rev: 112, color: "#C9A66B" },
            { label: "Enterprise finetune", fit: 79, rev: 88, color: "#60A5FA" },
            { label: "Managed burst", fit: 73, rev: 71, color: "#4ADE80" },
          ].map((r, idx) => (
            <g key={r.label} transform={`translate(0,${22 + idx * 46})`}>
              <text x="0" y="11" fontSize="9" fill="#E8EEF5" fontFamily="monospace">
                {r.label}
              </text>
              <rect x="0" y="17" width="210" height="6" rx="3" fill="rgba(255,255,255,0.05)" />
              <rect x="0" y="17" width={r.fit * 2.1} height="6" rx="3" fill={r.color} />
              <text x="220" y="22" fontSize="8" fill="#9AA7B5" fontFamily="monospace">
                fit {r.fit}
              </text>

              <rect x="280" y="8" width={r.rev * 0.7} height="14" rx="2" fill={`${r.color}AA`} />
              <text x="360" y="19" fontSize="8" fill="#E8EEF5" fontFamily="monospace" textAnchor="end">
                ${r.rev}M
              </text>
            </g>
          ))}

          <line x1="248" y1="12" x2="248" y2="214" stroke="#E8792F" strokeDasharray="3 3" opacity="0.8" />
          <text x="248" y="228" fontSize="9" fill="#E8792F" fontFamily="monospace" textAnchor="middle">
            margin floor
          </text>
        </g>
      </svg>
    </Frame>
  );
}
