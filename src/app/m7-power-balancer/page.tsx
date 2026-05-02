import { Suspense } from "react";
import { M7SimulatorShell } from "@/components/m7/SimulatorShell";

export default function M7Page() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "#9AA7B5" }}>Loading power scenario…</div>}>
      <M7SimulatorShell />
    </Suspense>
  );
}
