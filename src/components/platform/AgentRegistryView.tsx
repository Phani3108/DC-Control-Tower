"use client";

import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import registryJson from "@/data/agent-registry.json";

interface AgentRow {
  id: string;
  displayName: string;
  module: string;
  model: "opus" | "sonnet";
  promptPath: string;
  owner: string;
}

const AGENTS = (registryJson as { agents: AgentRow[] }).agents;

export function AgentRegistryView() {
  return (
    <Paper elevation={0} sx={{ p: 2.5, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="overline" color="text.secondary">Agent registry</Typography>
        <Chip size="small" label={`${AGENTS.length} agents`} sx={{ bgcolor: "rgba(201,166,107,0.15)", color: "#C9A66B" }} />
      </Stack>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Agent</TableCell>
              <TableCell>Module</TableCell>
              <TableCell>Model</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Prompt source</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {AGENTS.map((agent) => (
              <TableRow key={agent.id} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{agent.displayName}</Typography>
                  <Typography variant="caption" color="text.secondary">{agent.id}</Typography>
                </TableCell>
                <TableCell>
                  <Chip size="small" label={agent.module.toUpperCase()} variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={agent.model.toUpperCase()}
                    sx={{
                      bgcolor: agent.model === "opus" ? "rgba(201,166,107,0.14)" : "rgba(96,165,250,0.14)",
                      color: agent.model === "opus" ? "#C9A66B" : "#60A5FA",
                    }}
                  />
                </TableCell>
                <TableCell>{agent.owner}</TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">{agent.promptPath}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
