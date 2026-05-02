import { Suspense } from "react";
import { M5SimulatorShell } from "@/components/m5/SimulatorShell";

export default function M5Page() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "#9AA7B5" }}>Loading scenario…</div>}>
      <M5SimulatorShell />
    </Suspense>
  );
}
