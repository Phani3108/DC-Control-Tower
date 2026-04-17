import type { M3Input, M3Output } from "../types";
import { generateTelemetry, TELEMETRY_PRESETS } from "../synth/telemetry";
import { detectAnomalies } from "./anomaly";
import { predictFailures } from "./failurePredictor";
import { defaultSimulations } from "./simulation";

export function runM3(input: M3Input): M3Output {
  const preset = TELEMETRY_PRESETS[input.telemetryPreset] ?? TELEMETRY_PRESETS["zoneb-latency-0417"];
  const series = generateTelemetry({
    ...preset,
    incidentId: input.incidentId ?? preset.incidentId,
    startTime: input.startTime ?? preset.startTime,
    zone: input.zone ?? preset.zone,
  });

  const anomalies = detectAnomalies(series);
  const failureRisks = predictFailures(series, anomalies);
  const simulations = defaultSimulations(series);

  return {
    input,
    series,
    anomalies,
    failureRisks,
    simulations,
    generatedAt: new Date().toISOString(),
  };
}
