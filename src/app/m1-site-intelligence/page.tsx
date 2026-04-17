import { Suspense } from "react";
import { M1SimulatorShell } from "@/components/m1/SimulatorShell";

export default function M1Page() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "#9AA7B5" }}>Loading scenario…</div>}>
      <M1SimulatorShell />
    </Suspense>
  );
}
