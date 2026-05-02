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
import type { M8Input } from "@/lib/m8/types";

interface Props {
  value: M8Input;
  onChange: (next: M8Input) => void;
}

export function InputPanel({ value, onChange }: Props) {
  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Typography variant="overline" color="text.secondary">
        Tenant and commercial scenario
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
          label="Available MW"
          type="number"
          size="small"
          value={value.availableMW}
          onChange={(e) => onChange({ ...value, availableMW: Number(e.target.value) || 0 })}
          fullWidth
        />

        <TextField
          label="Committed MW"
          type="number"
          size="small"
          value={value.committedMW}
          onChange={(e) => onChange({ ...value, committedMW: Number(e.target.value) || 0 })}
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

        <FormControl size="small" fullWidth>
          <InputLabel>Target GPU</InputLabel>
          <Select
            label="Target GPU"
            value={value.targetGpu}
            onChange={(e) => onChange({ ...value, targetGpu: e.target.value as M8Input["targetGpu"] })}
          >
            <MenuItem value="H100">H100</MenuItem>
            <MenuItem value="H200">H200</MenuItem>
            <MenuItem value="B200">B200</MenuItem>
            <MenuItem value="GB200-NVL72">GB200-NVL72</MenuItem>
            <MenuItem value="MI300X">MI300X</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth>
          <InputLabel>Pricing mode</InputLabel>
          <Select
            label="Pricing mode"
            value={value.pricingMode}
            onChange={(e) => onChange({ ...value, pricingMode: e.target.value as M8Input["pricingMode"] })}
          >
            <MenuItem value="capacity-reservation">Capacity reservation</MenuItem>
            <MenuItem value="hybrid">Hybrid</MenuItem>
            <MenuItem value="usage-indexed">Usage indexed</MenuItem>
          </Select>
        </FormControl>

        <Stack spacing={1}>
          <Typography variant="caption" color="text.secondary">
            Contract term ({value.contractTermYears} years)
          </Typography>
          <Slider
            value={value.contractTermYears}
            min={1}
            max={10}
            step={1}
            marks
            valueLabelDisplay="auto"
            onChange={(_, v) => onChange({ ...value, contractTermYears: v as number })}
          />
        </Stack>

        <Stack spacing={1}>
          <Typography variant="caption" color="text.secondary">
            Renewable premium ({value.renewablePremiumPct}%)
          </Typography>
          <Slider
            value={value.renewablePremiumPct}
            min={0}
            max={25}
            step={1}
            marks
            valueLabelDisplay="auto"
            onChange={(_, v) => onChange({ ...value, renewablePremiumPct: v as number })}
          />
        </Stack>

        <TextField
          label="Financing cost (%)"
          type="number"
          size="small"
          value={value.financingCostPct}
          onChange={(e) => onChange({ ...value, financingCostPct: Number(e.target.value) || 0 })}
          fullWidth
        />

        <TextField
          label="Target gross margin (%)"
          type="number"
          size="small"
          value={value.targetGrossMarginPct}
          onChange={(e) => onChange({ ...value, targetGrossMarginPct: Number(e.target.value) || 0 })}
          fullWidth
        />

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip size="small" label={value.geography} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
          <Chip
            size="small"
            label={`${value.targetGpu} · ${value.pricingMode}`}
            sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
          />
        </Stack>
      </Stack>
    </Paper>
  );
}
