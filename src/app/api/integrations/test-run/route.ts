import { NextResponse } from "next/server";
import { runSandboxSmoke } from "@/lib/integrations/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const summary = await runSandboxSmoke();
  return NextResponse.json({
    message: summary.ok
      ? "Sandbox smoke tests passed."
      : "Sandbox smoke tests found failures. Check checks[].detail for errors.",
    ...summary,
  });
}
