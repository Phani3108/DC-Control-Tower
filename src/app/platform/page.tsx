import { Suspense } from "react";
import { PlatformShell } from "@/components/platform/PlatformShell";

export default function PlatformPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "#9AA7B5" }}>Loading platform…</div>}>
      <PlatformShell />
    </Suspense>
  );
}
