"use client";

import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";
import type { M2Workload } from "@/lib/m2/types";
import type { GPUSku, WorkloadShape } from "@/lib/shared/types";

interface Props {
  value: M2Workload;
  onChange: (v: M2Workload) => void;
}

export function InputPanel({ value, onChange }: Props) {
  const set = <K extends keyof M2Workload>(k: K, v: M2Workload[K]) => onChange({ ...value, [k]: v });

  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Typography variant="overline" color="text.secondary">Workload inputs</Typography>
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid size={{ xs: 6 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Shape</InputLabel>
            <Select label="Shape" value={value.shape} onChange={(e) => set("shape", e.target.value as WorkloadShape)}>
              <MenuItem value="training">Training</MenuItem>
              <MenuItem value="inference">Inference</MenuItem>
              <MenuItem value="mixed">Mixed</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>GPU SKU</InputLabel>
            <Select label="GPU SKU" value={value.gpu} onChange={(e) => set("gpu", e.target.value as GPUSku)}>
              <MenuItem value="H100">H100</MenuItem>
              <MenuItem value="H200">H200</MenuItem>
              <MenuItem value="B200">B200</MenuItem>
              <MenuItem value="GB200-NVL72">GB200 NVL72</MenuItem>
              <MenuItem value="MI300X">MI300X</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 6 }}>
          <TextField
            label="Cluster (MW)"
            size="small"
            type="number"
            value={value.clusterMW}
            onChange={(e) => set("clusterMW", Number(e.target.value))}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <TextField
            label="Latency SLA (ms)"
            size="small"
            type="number"
            value={value.latencySLAms ?? ""}
            onChange={(e) => set("latencySLAms", e.target.value ? Number(e.target.value) : undefined)}
            fullWidth
          />
        </Grid>

        <Grid size={{ xs: 6 }}>
          <TextField
            label="Customer ISO"
            size="small"
            value={value.customerGeography ?? ""}
            onChange={(e) => set("customerGeography", e.target.value.toUpperCase() || undefined)}
            fullWidth
            inputProps={{ maxLength: 2 }}
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <TextField
            label="Data ISO"
            size="small"
            value={value.dataGeography ?? ""}
            onChange={(e) => set("dataGeography", e.target.value.toUpperCase() || undefined)}
            fullWidth
            inputProps={{ maxLength: 2 }}
          />
        </Grid>

        <Grid size={{ xs: 6 }}>
          <TextField
            label="Budget $/MWh"
            size="small"
            type="number"
            value={value.budgetUSDPerMWhMax ?? ""}
            onChange={(e) => set("budgetUSDPerMWhMax", e.target.value ? Number(e.target.value) : undefined)}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <TextField
            label="Max PUE"
            size="small"
            type="number"
            inputProps={{ step: 0.01 }}
            value={value.sustainability?.pueMax ?? ""}
            onChange={(e) =>
              set("sustainability", {
                ...value.sustainability,
                pueMax: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            fullWidth
          />
        </Grid>
      </Grid>
    </Paper>
  );
}
