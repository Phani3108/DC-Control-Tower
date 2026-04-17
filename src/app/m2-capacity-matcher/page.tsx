import { Suspense } from "react";
import { M2SimulatorShell } from "@/components/m2/SimulatorShell";

export default function M2Page() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "#9AA7B5" }}>Loading scenario…</div>}>
      <M2SimulatorShell />
    </Suspense>
  );
}
