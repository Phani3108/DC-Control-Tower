"use client";

import { useMemo, useState } from "react";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";
import type { M6Output } from "@/lib/m6/types";

export function CoolingMemoView({ output }: { output: M6Output }) {
  const [copied, setCopied] = useState(false);

  const memo = useMemo(() => {
    const recommendations = output.recommendations.map((rec) => `- ${rec}`).join("\n");
    const topRisk = output.hotspotRisks[0];
    return [
      "# M6 Cooling Optimization Memo",
      "",
      `Facility: ${output.input.facilityName} (${output.input.facilityId})`,
      `Geography: ${output.input.geography}`,
      `IT load: ${output.input.targetITMW} MW`,
      "",
      `Current PUE: ${output.currentPUE.toFixed(3)}`,
      `Optimized PUE P50: ${output.optimizedPUEP50.toFixed(3)}`,
      `Optimized PUE P90: ${output.optimizedPUEP90.toFixed(3)}`,
      `Cooling energy savings: ${output.coolingEnergySavingsPct.toFixed(1)}%`,
      `Annual savings: $${output.annualSavingsUSDm.toFixed(2)}M`,
      `Top thermal risk: ${topRisk?.title ?? "N/A"}`,
      "",
      "## Recommended interventions",
      recommendations || "- No recommendations generated",
    ].join("\n");
  }, [output]);

  const copy = async () => {
    await navigator.clipboard.writeText(memo);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const blob = new Blob([memo], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `M6-cooling-memo-${output.input.facilityId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="overline" color="text.secondary">
          Cooling optimization memo
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" startIcon={<ContentCopyIcon />} onClick={copy}>
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={download}>
            .md
          </Button>
          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            Print / PDF
          </Button>
        </Stack>
      </Stack>

      <Typography variant="h6" sx={{ mt: 0.75 }}>
        {output.input.facilityName} · {output.input.targetITMW} MW
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Cooling PUE improves from {output.currentPUE.toFixed(3)} to {output.optimizedPUEP50.toFixed(3)} (P50).
        P90 is {output.optimizedPUEP90.toFixed(3)} with projected savings of ${output.annualSavingsUSDm.toFixed(2)}M annually.
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Stack spacing={1}>
        <Typography variant="caption" color="text.secondary">
          Recommended interventions
        </Typography>
        {output.recommendations.map((rec) => (
          <Typography key={rec} variant="body2">
            • {rec}
          </Typography>
        ))}
      </Stack>
    </Paper>
  );
}
