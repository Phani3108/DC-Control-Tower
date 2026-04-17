import { Suspense } from "react";
import { M4SimulatorShell } from "@/components/m4/SimulatorShell";

export default function M4Page() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "#9AA7B5" }}>Loading scenario…</div>}>
      <M4SimulatorShell />
    </Suspense>
  );
}
