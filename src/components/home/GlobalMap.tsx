"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import damacJson from "@/data/damac-facilities.json";
import type { DAMACFacility } from "@/lib/shared/types";

const FACILITIES = (damacJson as unknown as { facilities: DAMACFacility[] }).facilities;

const STATUS_COLOR: Record<string, string> = {
  operational: "#4ADE80",
  "under-construction": "#F4B740",
  planned: "#60A5FA",
  announced: "#9AA7B5",
};

// Public-domain world topo; served by react-simple-maps docs
const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export function GlobalMap() {
  const [hover, setHover] = useState<DAMACFacility | null>(null);

  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)", position: "relative" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="overline" color="text.secondary">
          Global footprint · {FACILITIES.length} facilities · {totalMW()} MW planned
        </Typography>
        <Stack direction="row" spacing={1}>
          {Object.entries(STATUS_COLOR).map(([k, c]) => (
            <Chip
              key={k}
              label={k}
              size="small"
              sx={{
                bgcolor: `${c}22`,
                color: c,
                fontSize: 10,
                height: 20,
                fontWeight: 600,
                textTransform: "capitalize",
              }}
            />
          ))}
        </Stack>
      </Stack>

      <Box sx={{ width: "100%", height: 360, position: "relative", cursor: "default" }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 130, center: [30, 20] }}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1A2230"
                  stroke="#0B0F14"
                  strokeWidth={0.4}
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "#22304A", outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {FACILITIES.map((f) => {
            const r = Math.max(4, Math.min(16, Math.sqrt(f.capacityMW) * 0.9));
            return (
              <Marker
                key={f.id}
                coordinates={f.coordinates}
                onMouseEnter={() => setHover(f)}
                onMouseLeave={() => setHover(null)}
              >
                <circle r={r + 4} fill={STATUS_COLOR[f.status]} fillOpacity={0.15} />
                <circle r={r} fill={STATUS_COLOR[f.status]} fillOpacity={0.85} stroke="#0B0F14" strokeWidth={1} />
              </Marker>
            );
          })}
        </ComposableMap>

        {hover && (
          <Box
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              minWidth: 220,
              p: 1.5,
              bgcolor: "rgba(20,26,35,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 1,
              pointerEvents: "none",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{hover.name}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              {hover.city}, {hover.country}
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: "wrap", gap: 0.5 }}>
              <Chip
                label={hover.status}
                size="small"
                sx={{
                  bgcolor: `${STATUS_COLOR[hover.status]}22`,
                  color: STATUS_COLOR[hover.status],
                  height: 18,
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
              <Chip label={`${hover.capacityMW} MW`} size="small" sx={{ height: 18, fontSize: 10 }} />
              <Chip label={`Tier ${hover.tier}`} size="small" sx={{ height: 18, fontSize: 10 }} />
              <Chip label={`PUE ${hover.puE}`} size="small" sx={{ height: 18, fontSize: 10 }} />
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              {hover.coolingType} · ≤{hover.maxRackDensityKW} kW/rack
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}

function totalMW(): string {
  return FACILITIES.reduce((s, f) => s + f.capacityMW, 0).toLocaleString();
}
