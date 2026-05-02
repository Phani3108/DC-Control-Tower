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
import type { M7Output } from "@/lib/m7/types";

export function PowerMemoView({ output }: { output: M7Output }) {
  const [copied, setCopied] = useState(false);

  const memo = useMemo(() => {
    const recommendations = output.recommendations.map((rec) => `- ${rec}`).join("\n");
    const topRisk = output.gridRisks[0];

    return [
      "# M7 Power Balancing Memo",
      "",
      `Facility: ${output.input.facilityName} (${output.input.facilityId})`,
      `Geography: ${output.input.geography}`,
      `Gross facility load: ${output.grossFacilityMW.toFixed(2)} MW`,
      "",
      `Firm available supply: ${output.firmAvailableMW.toFixed(2)} MW`,
      `Reserve headroom: ${output.reserveHeadroomMW.toFixed(2)} MW`,
      `Curtailed load envelope: ${output.curtailedLoadMW.toFixed(2)} MW`,
      `Battery runtime at peak deficit: ${output.batteryRuntimeMinAtDeficit.toFixed(1)} minutes`,
      `Blended power cost: $${output.blendedPowerCostUSDPerMWh.toFixed(2)}/MWh`,
      `Annual power cost: $${output.annualPowerCostUSDm.toFixed(2)}M`,
      `Top grid risk: ${topRisk?.title ?? "N/A"}`,
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
    a.download = `M7-power-memo-${output.input.facilityId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="overline" color="text.secondary">
          Power balancing memo
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
        {output.input.facilityName} · {output.grossFacilityMW.toFixed(2)} MW gross load
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Dispatch plan maintains {output.reserveHeadroomMW.toFixed(2)} MW reserve headroom with blended cost of
        ${output.blendedPowerCostUSDPerMWh.toFixed(2)}/MWh and annualized spend of ${output.annualPowerCostUSDm.toFixed(2)}M.
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
