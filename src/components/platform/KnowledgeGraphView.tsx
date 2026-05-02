"use client";

import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import facilitiesJson from "@/data/damac-facilities.json";
import competitorsJson from "@/data/competitors.json";
import regulationsJson from "@/data/regulations.json";

interface Edge {
  from: string;
  to: string;
  relation: string;
}

const FACILITIES = (facilitiesJson as { facilities: Array<{ id: string; name: string; countryCode: string; region: string }> }).facilities;
const COMPETITORS = (competitorsJson as { competitors: Array<{ id: string; name: string; type: string }> }).competitors;
const JURISDICTIONS = (regulationsJson as { jurisdictions: Array<{ code: string; country: string }> }).jurisdictions;

const COUNTRY_TO_JURISDICTION: Record<string, string> = {
  AE: "AE",
  SA: "SA",
  ES: "ES",
  GR: "GR",
  TR: "TR",
  ID: "ID",
  TH: "TH",
  US: "US-VA",
};

function buildEdges(): Edge[] {
  const edges: Edge[] = [];

  for (const facility of FACILITIES) {
    const jurisdiction = COUNTRY_TO_JURISDICTION[facility.countryCode];
    if (jurisdiction) {
      edges.push({
        from: facility.id,
        to: `jurisdiction:${jurisdiction}`,
        relation: "governed-by",
      });
    }
    edges.push({ from: facility.id, to: `region:${facility.region}`, relation: "located-in" });
  }

  for (const competitor of COMPETITORS) {
    edges.push({ from: `competitor:${competitor.id}`, to: "market:ai-colocation", relation: "competes-in" });
  }

  const moduleEdges: Edge[] = [
    { from: "module:m1", to: "domain:site-origination", relation: "optimizes" },
    { from: "module:m2", to: "domain:solution-engineering", relation: "optimizes" },
    { from: "module:m3", to: "domain:runtime-operations", relation: "optimizes" },
    { from: "module:m4", to: "domain:sovereignty-routing", relation: "optimizes" },
    { from: "module:m5", to: "domain:delivery-execution", relation: "optimizes" },
    { from: "module:m6", to: "domain:cooling-optimization", relation: "optimizes" },
    { from: "module:m7", to: "domain:power-balancing", relation: "optimizes" },
    { from: "module:m8", to: "domain:tenant-monetization", relation: "optimizes" },
  ];

  return [...edges, ...moduleEdges];
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Paper elevation={0} sx={{ p: 2, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h5" sx={{ mt: 0.5 }}>{value}</Typography>
    </Paper>
  );
}

export function KnowledgeGraphView() {
  const edges = buildEdges();

  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 3 }}><MetricCard label="Facility nodes" value={String(FACILITIES.length)} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><MetricCard label="Jurisdiction nodes" value={String(JURISDICTIONS.length)} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><MetricCard label="Competitor nodes" value={String(COMPETITORS.length)} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><MetricCard label="Relationships" value={String(edges.length)} /></Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 2.5, border: "1px solid rgba(255,255,255,0.08)" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography variant="overline" color="text.secondary">Knowledge graph relations</Typography>
          <Chip size="small" label="Live from local data" sx={{ bgcolor: "rgba(74,222,128,0.14)", color: "#4ADE80" }} />
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>From</TableCell>
                <TableCell>Relation</TableCell>
                <TableCell>To</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {edges.slice(0, 30).map((edge, idx) => (
                <TableRow key={`${edge.from}-${edge.to}-${idx}`}>
                  <TableCell>{edge.from}</TableCell>
                  <TableCell>{edge.relation}</TableCell>
                  <TableCell>{edge.to}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  );
}
