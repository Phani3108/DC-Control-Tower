import { Suspense } from "react";
import { M8SimulatorShell } from "@/components/m8/SimulatorShell";

export default function M8Page() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "#9AA7B5" }}>Loading tenant scenario…</div>}>
      <M8SimulatorShell />
    </Suspense>
  );
}
