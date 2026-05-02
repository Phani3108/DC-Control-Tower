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
import type { M6Input } from "@/lib/m6/types";

interface Props {
  value: M6Input;
  onChange: (next: M6Input) => void;
}

export function InputPanel({ value, onChange }: Props) {
  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Typography variant="overline" color="text.secondary">
        Cooling scenario
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
          label="Ambient temperature (°C)"
          type="number"
          size="small"
          value={value.ambientTempC}
          onChange={(e) => onChange({ ...value, ambientTempC: Number(e.target.value) || 0 })}
          fullWidth
        />

        <Stack spacing={1}>
          <Typography variant="caption" color="text.secondary">
            Relative humidity ({value.humidityPct}%)
          </Typography>
          <Slider
            value={value.humidityPct}
            min={20}
            max={80}
            step={1}
            marks
            valueLabelDisplay="auto"
            onChange={(_, v) => onChange({ ...value, humidityPct: v as number })}
          />
        </Stack>

        <Stack spacing={1}>
          <Typography variant="caption" color="text.secondary">
            Rack density ({value.rackDensityKW} kW/rack)
          </Typography>
          <Slider
            value={value.rackDensityKW}
            min={30}
            max={140}
            step={2}
            marks
            valueLabelDisplay="auto"
            onChange={(_, v) => onChange({ ...value, rackDensityKW: v as number })}
          />
        </Stack>

        <FormControl size="small" fullWidth>
          <InputLabel>Cooling mode</InputLabel>
          <Select
            label="Cooling mode"
            value={value.coolingMode}
            onChange={(e) => onChange({ ...value, coolingMode: e.target.value as M6Input["coolingMode"] })}
          >
            <MenuItem value="air">Air cooling</MenuItem>
            <MenuItem value="hybrid-dlc">Hybrid DLC</MenuItem>
            <MenuItem value="full-dlc">Full DLC</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth>
          <InputLabel>Redundancy tier</InputLabel>
          <Select
            label="Redundancy tier"
            value={value.redundancyTier}
            onChange={(e) => onChange({ ...value, redundancyTier: e.target.value as M6Input["redundancyTier"] })}
          >
            <MenuItem value="N+1">N+1</MenuItem>
            <MenuItem value="2N">2N</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Target PUE"
          type="number"
          size="small"
          value={value.pueTarget}
          onChange={(e) => onChange({ ...value, pueTarget: Number(e.target.value) || 0 })}
          fullWidth
        />

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip size="small" label={value.geography} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
          <Chip size="small" label={`${value.coolingMode.toUpperCase()} · ${value.redundancyTier}`} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
        </Stack>
      </Stack>
    </Paper>
  );
}
