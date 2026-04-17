"use client";

import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import type { M1Input } from "@/lib/m1/types";
import type { CandidateSite } from "@/lib/shared/types";

interface Props {
  value: M1Input;
  onChange: (next: M1Input) => void;
  sites: CandidateSite[];
}

export function InputPanel({ value, onChange, sites }: Props) {
  const toggleSite = (id: string) => {
    const set = new Set(value.candidateSiteIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange({ ...value, candidateSiteIds: Array.from(set) });
  };

  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Typography variant="overline" color="text.secondary">Scenario inputs</Typography>
      <Stack spacing={2.5} sx={{ mt: 1.5 }}>
        <TextField
          label="Target capacity (MW)"
          type="number"
          size="small"
          value={value.targetMW}
          onChange={(e) => onChange({ ...value, targetMW: Number(e.target.value) })}
          inputProps={{ min: 10, max: 5000, step: 10 }}
          fullWidth
        />

        <FormControl size="small" fullWidth>
          <InputLabel>Region</InputLabel>
          <Select
            label="Region"
            value={value.region}
            onChange={(e) => onChange({ ...value, region: e.target.value as M1Input["region"] })}
          >
            <MenuItem value="ME">Middle East</MenuItem>
            <MenuItem value="APAC">APAC</MenuItem>
            <MenuItem value="EU">Europe</MenuItem>
            <MenuItem value="US">United States</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth>
          <InputLabel>Workload profile</InputLabel>
          <Select
            label="Workload profile"
            value={value.workloadProfile}
            onChange={(e) =>
              onChange({ ...value, workloadProfile: e.target.value as M1Input["workloadProfile"] })
            }
          >
            <MenuItem value="hyperscale-training">Hyperscale training</MenuItem>
            <MenuItem value="sovereign-inference">Sovereign inference</MenuItem>
            <MenuItem value="edge">Edge / distributed</MenuItem>
          </Select>
        </FormControl>

        <Box>
          <Typography variant="overline" color="text.secondary">Candidate sites</Typography>
          <Stack sx={{ mt: 0.5 }}>
            {sites.map((s) => (
              <FormControlLabel
                key={s.id}
                control={
                  <Checkbox
                    checked={value.candidateSiteIds.includes(s.id)}
                    onChange={() => toggleSite(s.id)}
                    size="small"
                  />
                }
                label={
                  <span>
                    <strong>{s.name}</strong>{" "}
                    <Typography component="span" variant="caption" color="text.secondary">
                      · {s.country}
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
