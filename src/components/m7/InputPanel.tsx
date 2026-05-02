"use client";

import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Slider from "@mui/material/Slider";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import type { M7Input } from "@/lib/m7/types";

interface Props {
  value: M7Input;
  onChange: (next: M7Input) => void;
  onIngestLive?: () => Promise<void> | void;
  ingestingLive?: boolean;
  liveSignalState?: "live" | "stale" | "mock" | "error";
  liveSignalSummary?: string;
}

export function InputPanel({
  value,
  onChange,
  onIngestLive,
  ingestingLive = false,
  liveSignalState,
  liveSignalSummary,
}: Props) {
  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Typography variant="overline" color="text.secondary">
        Power scenario
      </Typography>

      <Stack spacing={2.5} sx={{ mt: 1.5 }}>
        <TextField
          label="Facility"
          size="small"
          value={value.facilityName}
          onChange={(e) => onChange({ ...value, facilityName: e.target.value })}
          fullWidth
        />

        <TextField
          label="Target IT load (MW)"
          type="number"
          size="small"
          value={value.targetITMW}
          onChange={(e) => onChange({ ...value, targetITMW: Number(e.target.value) || 0 })}
          fullWidth
        />

        <TextField
          label="Facility PUE"
          type="number"
          size="small"
          value={value.pue}
          onChange={(e) => onChange({ ...value, pue: Number(e.target.value) || 0 })}
          fullWidth
        />

        <TextField
          label="Utility feed (MW)"
          type="number"
          size="small"
          value={value.utilityFeedMW}
          onChange={(e) => onChange({ ...value, utilityFeedMW: Number(e.target.value) || 0 })}
          fullWidth
        />

        <TextField
          label="On-site generation (MW)"
          type="number"
          size="small"
          value={value.onsiteGenerationMW}
          onChange={(e) => onChange({ ...value, onsiteGenerationMW: Number(e.target.value) || 0 })}
          fullWidth
        />

        <TextField
          label="Battery capacity (MWh)"
          type="number"
          size="small"
          value={value.batteryMWh}
          onChange={(e) => onChange({ ...value, batteryMWh: Number(e.target.value) || 0 })}
          fullWidth
        />

        <TextField
          label="Spot price (USD/MWh)"
          type="number"
          size="small"
          value={value.spotPriceUSDPerMWh}
          onChange={(e) => onChange({ ...value, spotPriceUSDPerMWh: Number(e.target.value) || 0 })}
          fullWidth
        />

        <Stack spacing={1}>
          <Typography variant="caption" color="text.secondary">
            Demand response allowance ({value.demandResponsePct}%)
          </Typography>
          <Slider
            value={value.demandResponsePct}
            min={0}
            max={30}
            step={1}
            marks
            valueLabelDisplay="auto"
            onChange={(_, v) => onChange({ ...value, demandResponsePct: v as number })}
          />
        </Stack>

        <FormControl size="small" fullWidth>
          <InputLabel>Contract mode</InputLabel>
          <Select
            label="Contract mode"
            value={value.contractMode}
            onChange={(e) => onChange({ ...value, contractMode: e.target.value as M7Input["contractMode"] })}
          >
            <MenuItem value="firm-ppa">Firm PPA</MenuItem>
            <MenuItem value="hybrid-ppa-spot">Hybrid PPA + spot</MenuItem>
            <MenuItem value="merchant">Merchant exposed</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth>
          <InputLabel>Reserve policy</InputLabel>
          <Select
            label="Reserve policy"
            value={value.reservePolicy}
            onChange={(e) => onChange({ ...value, reservePolicy: e.target.value as M7Input["reservePolicy"] })}
          >
            <MenuItem value="N-1">N-1</MenuItem>
            <MenuItem value="N-2">N-2</MenuItem>
          </Select>
        </FormControl>

        <Stack spacing={1}>
          <Button
            variant="outlined"
            onClick={() => onIngestLive?.()}
            disabled={!onIngestLive || ingestingLive}
            sx={{ borderColor: "rgba(255,255,255,0.18)" }}
          >
            {ingestingLive ? "Ingesting live signals..." : "Ingest live utility and market signals"}
          </Button>
          {liveSignalSummary && (
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                label={liveSignalState ?? "unknown"}
                color={liveSignalState === "live" ? "success" : liveSignalState === "error" ? "error" : "warning"}
              />
              <Typography variant="caption" color="text.secondary">
                {liveSignalSummary}
              </Typography>
            </Stack>
          )}
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip size="small" label={value.geography} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
          <Chip
            size="small"
            label={`${value.contractMode} · ${value.reservePolicy}`}
            sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
          />
        </Stack>
      </Stack>
    </Paper>
  );
}
