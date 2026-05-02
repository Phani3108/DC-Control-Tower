import { Suspense } from "react";
import { M6SimulatorShell } from "@/components/m6/SimulatorShell";

export default function M6Page() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "#9AA7B5" }}>Loading cooling scenario…</div>}>
      <M6SimulatorShell />
    </Suspense>
  );
}
