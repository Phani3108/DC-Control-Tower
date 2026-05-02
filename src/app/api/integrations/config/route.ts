import { NextResponse } from "next/server";
import {
  getIntegrationCatalog,
  listIntegrationViews,
  saveIntegrations,
  type SaveIntegrationInput,
} from "@/lib/integrations/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [integrations, catalog] = await Promise.all([
    listIntegrationViews(),
    Promise.resolve(getIntegrationCatalog()),
  ]);

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    integrations,
    catalog,
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | {
        integrations?: SaveIntegrationInput[];
      }
    | null;

  if (!body?.integrations || !Array.isArray(body.integrations)) {
    return NextResponse.json({ ok: false, message: "Body must include integrations[]" }, { status: 400 });
  }

  const next = await saveIntegrations(body.integrations);

  return NextResponse.json({
    ok: true,
    message: "Integration settings saved.",
    integrations: next,
    generatedAt: new Date().toISOString(),
  });
}
