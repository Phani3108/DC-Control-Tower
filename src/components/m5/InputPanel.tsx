"use client";

import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import type { M5Input } from "@/lib/m5/types";

interface Props {
  value: M5Input;
  onChange: (next: M5Input) => void;
}

export function InputPanel({ value, onChange }: Props) {
  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Typography variant="overline" color="text.secondary">
        Build scenario
      </Typography>
      <Stack spacing={2.5} sx={{ mt: 1.5 }}>
        <TextField
          label="Project"
          size="small"
          value={value.projectName}
          onChange={(e) => onChange({ ...value, projectName: e.target.value })}
          fullWidth
        />

        <TextField
          label="Target MW"
          type="number"
          size="small"
          value={value.targetMW}
          onChange={(e) => onChange({ ...value, targetMW: Number(e.target.value) || 0 })}
          fullWidth
        />

        <TextField
          label="Utility queue (months)"
          type="number"
          size="small"
          value={value.utilityQueueMonths}
          onChange={(e) => onChange({ ...value, utilityQueueMonths: Number(e.target.value) || 0 })}
          fullWidth
        />

        <Stack spacing={1}>
          <Typography variant="caption" color="text.secondary">
            Permit complexity
          </Typography>
          <Slider
            value={value.permitComplexity}
            min={1}
            max={5}
            step={1}
            marks
            valueLabelDisplay="auto"
            onChange={(_, v) => onChange({ ...value, permitComplexity: v as M5Input["permitComplexity"] })}
          />
        </Stack>

        <Stack spacing={1}>
          <Typography variant="caption" color="text.secondary">
            Long-lead tightness
          </Typography>
          <Slider
            value={value.longLeadTightness}
            min={1}
            max={5}
            step={1}
            marks
            valueLabelDisplay="auto"
            onChange={(_, v) => onChange({ ...value, longLeadTightness: v as M5Input["longLeadTightness"] })}
          />
        </Stack>

        <Stack spacing={1}>
          <Typography variant="caption" color="text.secondary">
            EPC readiness
          </Typography>
          <Slider
            value={value.epcReadiness}
            min={1}
            max={5}
            step={1}
            marks
            valueLabelDisplay="auto"
            onChange={(_, v) => onChange({ ...value, epcReadiness: v as M5Input["epcReadiness"] })}
          />
        </Stack>

        <TextField
          label="Schedule contingency (%)"
          type="number"
          size="small"
          value={value.contingencyPct}
          onChange={(e) => onChange({ ...value, contingencyPct: Number(e.target.value) || 0 })}
          fullWidth
        />

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip size="small" label={value.geography} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
          <Chip size="small" label={`NTP ${value.plannedNoticeToProceed}`} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
        </Stack>
      </Stack>
    </Paper>
  );
}
