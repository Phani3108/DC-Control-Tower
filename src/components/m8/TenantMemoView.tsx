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
import type { M8Output } from "@/lib/m8/types";

export function TenantMemoView({ output }: { output: M8Output }) {
  const [copied, setCopied] = useState(false);

  const memo = useMemo(() => {
    const topTenant = output.tenantFits[0];
    const recommendations = output.recommendations.map((rec) => `- ${rec}`).join("\n");

    return [
      "# M8 Tenant Fit and Revenue Memo",
      "",
      `Facility: ${output.input.facilityName} (${output.input.facilityId})`,
      `Geography: ${output.input.geography}`,
      `Sellable capacity: ${output.sellableMW.toFixed(2)} MW`,
      `Target GPU: ${output.input.targetGpu}`,
      "",
      `Projected revenue: $${output.totalProjectedRevenueUSDm.toFixed(2)}M`,
      `Weighted price: $${output.weightedPriceUSDPerMWh.toFixed(2)}/MWh`,
      `Weighted gross margin: ${output.weightedGrossMarginPct.toFixed(1)}%`,
      `Payback P50/P90: ${output.paybackMonthsP50.toFixed(1)} / ${output.paybackMonthsP90.toFixed(1)} months`,
      `Top tenant archetype: ${topTenant?.archetype ?? "N/A"}`,
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
    a.download = `M8-tenant-memo-${output.input.facilityId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="overline" color="text.secondary">
          Tenant optimization memo
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
        {output.input.facilityName} · ${output.totalProjectedRevenueUSDm.toFixed(2)}M projected
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Weighted margin lands at {output.weightedGrossMarginPct.toFixed(1)}% with payback at {output.paybackMonthsP50.toFixed(1)} months (P50)
        and {output.paybackMonthsP90.toFixed(1)} months (P90).
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
