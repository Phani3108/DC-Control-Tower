import competitorsJson from "@/data/competitors.json";
import type { CompetitorComparison, M2Workload } from "../types";

interface Competitor {
  id: string;
  name: string;
  pricePerMWhUSDBand: [number, number];
  strengths: string[];
  weaknesses: string[];
}

const COMPETITORS = (competitorsJson as unknown as { competitors: Competitor[] }).competitors;

/**
 * Compare a DAMAC $/MWh all-in price to each competitor's published price band
 * and return a per-competitor delta + a short qualitative note.
 */
export function buildCompetitorComparisons(damacUSDPerMWh: number, workload: M2Workload): CompetitorComparison[] {
  return COMPETITORS.map((c) => {
    const midBand = (c.pricePerMWhUSDBand[0] + c.pricePerMWhUSDBand[1]) / 2;
    const deltaPct = Math.round(((midBand - damacUSDPerMWh) / midBand) * 100);

    let notes: string;
    if (deltaPct > 0) {
      notes = `DAMAC ~${deltaPct}% cheaper vs. ${c.name} midband. Key ${c.name} tradeoffs: ${c.weaknesses.slice(0, 2).join(", ")}.`;
    } else if (deltaPct < 0) {
      notes = `DAMAC ~${Math.abs(deltaPct)}% more expensive than ${c.name} midband; however DAMAC wins on ${(c.weaknesses[0] ?? "AI-readiness").toLowerCase()}.`;
    } else {
      notes = `Price parity with ${c.name}; differentiation through ${c.weaknesses.slice(0, 1).join(", ") || "AI-readiness"}.`;
    }

    return {
      competitorId: c.id,
      competitorName: c.name,
      pricePerMWhUSDBand: c.pricePerMWhUSDBand,
      priceDeltaPctVsDAMAC: deltaPct,
      notes,
    };
  });
}
