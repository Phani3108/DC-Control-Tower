import { Suspense } from "react";
import { M3SimulatorShell } from "@/components/m3/SimulatorShell";

export default function M3Page() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "#9AA7B5" }}>Loading scenario…</div>}>
      <M3SimulatorShell />
    </Suspense>
  );
}
