import { NextResponse } from "next/server";
import { testAllIntegrations, testIntegration } from "@/lib/integrations/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | {
        id?: string;
        all?: boolean;
      }
    | null;

  if (body?.all) {
    const results = await testAllIntegrations();
    return NextResponse.json({
      ok: true,
      testedAt: new Date().toISOString(),
      results,
    });
  }

  if (!body?.id) {
    return NextResponse.json({ ok: false, message: "Provide { id } or { all: true }" }, { status: 400 });
  }

  const result = await testIntegration(body.id);
  return NextResponse.json({ ok: result.ok, id: body.id, result });
}
