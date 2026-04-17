"use client";

import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Box from "@mui/material/Box";
import type { M4Input } from "@/lib/m4/types";
import type { DAMACFacility } from "@/lib/shared/types";

interface Props {
  value: M4Input;
  onChange: (v: M4Input) => void;
  facilities: DAMACFacility[];
}

export function InputPanel({ value, onChange, facilities }: Props) {
  const toggleFacility = (id: string) => {
    const set = new Set(value.candidateFacilityIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange({ ...value, candidateFacilityIds: Array.from(set) });
  };

  const countries = value.customerDataCountries.join(", ");

  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Typography variant="overline" color="text.secondary">Scenario inputs</Typography>
      <Stack spacing={2.5} sx={{ mt: 1.5 }}>
        <FormControl size="small" fullWidth>
          <InputLabel>Workload category</InputLabel>
          <Select
            label="Workload category"
            value={value.workloadCategory}
            onChange={(e) => onChange({ ...value, workloadCategory: e.target.value as M4Input["workloadCategory"] })}
          >
            <MenuItem value="fintech-inference">Fintech inference</MenuItem>
            <MenuItem value="health-training">Health / life-sciences training</MenuItem>
            <MenuItem value="public-sector-inference">Public-sector inference</MenuItem>
            <MenuItem value="general-inference">General inference</MenuItem>
            <MenuItem value="general-training">General training</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Customer data origin (ISO codes, comma-separated)"
          size="small"
          value={countries}
          onChange={(e) =>
            onChange({
              ...value,
              customerDataCountries: e.target.value
                .split(",")
                .map((s) => s.trim().toUpperCase())
                .filter(Boolean),
            })
          }
          fullWidth
          helperText="e.g. ES, GR, DE, FR"
        />

        <Box>
          <Typography variant="overline" color="text.secondary">Candidate DAMAC facilities</Typography>
          <Stack sx={{ mt: 0.5, maxHeight: 260, overflowY: "auto" }}>
            {facilities.map((f) => (
              <FormControlLabel
                key={f.id}
                control={
                  <Checkbox
                    checked={value.candidateFacilityIds.includes(f.id)}
                    onChange={() => toggleFacility(f.id)}
                    size="small"
                  />
                }
                label={
                  <span>
                    <strong>{f.name}</strong>{" "}
                    <Typography component="span" variant="caption" color="text.secondary">
                      · {f.country} · {f.capacityMW} MW
                    </Typography>
                  </span>
                }
              />
            ))}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}
