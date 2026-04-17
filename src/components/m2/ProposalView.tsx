"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import DownloadIcon from "@mui/icons-material/Download";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PrintIcon from "@mui/icons-material/Print";
import { renderProposalBrief } from "@/lib/m2/proposal";
import type { M2Output } from "@/lib/m2/types";
import type { ProposalSynthesis } from "./ProposalStream";

export function ProposalView({
  output,
  synthesis,
}: {
  output: M2Output;
  synthesis: ProposalSynthesis | null;
}) {
  const brief = useMemo(() => renderProposalBrief(output, synthesis ?? undefined), [output, synthesis]);
  const [copied, setCopied] = useState(false);

  const download = () => {
    const blob = new Blob([brief], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proposal-${output.input.workload.clusterMW}MW-${output.input.workload.gpu}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="overline" color="text.secondary">Customer-ready proposal</Typography>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" startIcon={<ContentCopyIcon />} onClick={copy}>
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={download}>.md</Button>
          <Button size="small" variant="contained" color="primary" startIcon={<PrintIcon />} onClick={() => window.print()}>
            Print / PDF
          </Button>
        </Stack>
      </Stack>

      <Box
        sx={{
          p: 2,
          fontFamily: '"SF Mono", Menlo, Consolas, monospace',
          fontSize: 12.5,
          lineHeight: 1.55,
          whiteSpace: "pre-wrap",
          bgcolor: "rgba(255,255,255,0.02)",
          borderRadius: 1,
          maxHeight: 500,
          overflowY: "auto",
        }}
      >
        {brief}
      </Box>
    </Paper>
  );
}
