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
import type { M5Output } from "@/lib/m5/types";

export function ProjectMemoView({ output }: { output: M5Output }) {
  const topRisk = output.risks[0];
  const [copied, setCopied] = useState(false);

  const memo = useMemo(() => {
    const recommendations = output.recommendations.map((rec) => `- ${rec}`).join("\n");
    return [
      `# M5 Project Memo`,
      ``,
      `Project: ${output.input.projectName} (${output.input.projectId})`,
      `Geography: ${output.input.geography}`,
      `Target MW: ${output.input.targetMW}`,
      ``,
      `P50 energization: ${output.p50EnergizationDate}`,
      `P90 energization: ${output.p90EnergizationDate}`,
      `Schedule spread: ${output.scheduleSpreadDays} days`,
      `Capex at risk: $${output.capexAtRiskUSDm.toFixed(2)}M`,
      `Top risk: ${topRisk?.title ?? "Delivery risk"}`,
      ``,
      `## Recommended interventions`,
      recommendations || "- No recommendations generated",
    ].join("\n");
  }, [output, topRisk]);

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
    a.download = `M5-project-memo-${output.input.projectId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="overline" color="text.secondary">
          Project risk memo
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
        {output.input.projectName} · {output.input.targetMW} MW
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        P50 energization is {output.p50EnergizationDate}. P90 shifts to {output.p90EnergizationDate} with a spread of {output.scheduleSpreadDays} days.
        Current capex-at-risk is ${output.capexAtRiskUSDm.toFixed(2)}M, led by {topRisk?.title.toLowerCase() ?? "delivery risk"}.
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
