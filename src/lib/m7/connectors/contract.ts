import type { M7Input } from "@/lib/m7/types";

export type ConnectorSignalState = "live" | "stale" | "mock";

export interface UtilityTelemetrySignal {
  state: ConnectorSignalState;
  source: string;
  observedAt: string;
  utilityFeedMW: number;
  onsiteGenerationMW: number;
  reserveConstraintMW?: number;
}

export interface MarketPriceSignal {
  state: ConnectorSignalState;
  source: string;
  observedAt: string;
  spotPriceUSDPerMWh: number;
  forwardPriceUSDPerMWh?: number;
  marketRegion?: string;
}

export interface M7IngestionEnvelope {
  utility: UtilityTelemetrySignal;
  market: MarketPriceSignal;
  recommendedInputPatch: Pick<M7Input, "utilityFeedMW" | "onsiteGenerationMW" | "spotPriceUSDPerMWh">;
}
