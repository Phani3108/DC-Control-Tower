import { NextResponse } from "next/server";
import { ingestM7Signals } from "@/lib/m7/connectors/adapter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const envelope = await ingestM7Signals();
    return NextResponse.json({ ok: true, envelope });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
