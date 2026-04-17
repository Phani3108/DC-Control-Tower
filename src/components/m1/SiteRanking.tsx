"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import type { M1Output, SiteScorecard } from "@/lib/m1/types";

interface Props {
  output: M1Output;
  selectedSiteId: string | null;
  onSelect: (siteId: string) => void;
}

export function SiteRanking({ output, selectedSiteId, onSelect }: Props) {
  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
      <Typography variant="overline" color="text.secondary">Ranked results</Typography>
      <Stack spacing={1.5} sx={{ mt: 1.5 }}>
        {output.scorecards.map((c) => (
          <RankRow
            key={c.site.id}
            card={c}
            selected={c.site.id === selectedSiteId}
            onClick={() => onSelect(c.site.id)}
          />
        ))}
      </Stack>
    </Paper>
  );
}

function RankRow({
  card,
  selected,
  onClick,
}: {
  card: SiteScorecard;
  selected: boolean;
  onClick: () => void;
}) {
  const accent =
    card.rank === 1
      ? "primary.main"
      : card.rank === 2
        ? "secondary.main"
        : "divider";

  return (
    <Box
      onClick={onClick}
      sx={{
        p: 1.5,
        borderRadius: 1,
        border: "1px solid",
        borderColor: selected ? "primary.main" : "rgba(255,255,255,0.08)",
        bgcolor: selected ? "rgba(201,166,107,0.06)" : "transparent",
        cursor: "pointer",
        transition: "border-color .15s, background-color .15s",
        "&:hover": { borderColor: "primary.light" },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            bgcolor: accent,
            color: "background.default",
            display: "grid",
            placeItems: "center",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {card.rank}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
            {card.site.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {card.site.country} · TCO ${card.tco5yrUSDm}M
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ minWidth: 48, textAlign: "right" }}>
          {card.overallScore.toFixed(1)}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={card.overallScore}
        sx={{
          height: 3,
          mt: 1,
          borderRadius: 1,
          bgcolor: "rgba(255,255,255,0.06)",
          "& .MuiLinearProgress-bar": { bgcolor: accent },
        }}
      />
      {card.blockingFlags.length > 0 && (
        <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
          {card.blockingFlags.map((f) => (
            <Chip
              key={f}
              label={f}
              size="small"
              color="warning"
              variant="outlined"
              sx={{ fontSize: 10, height: 18 }}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
