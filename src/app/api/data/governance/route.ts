import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { PRESETS } from "@/data/presets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HITLState = "pending" | "approved" | "sent-back";
type HITLAction = "approve" | "send-back" | "reset";

interface ReviewerMeta {
  name: string;
  role: string;
  reviewerId?: string;
}

interface HITLHistoryEntry {
  action: HITLAction;
  state: HITLState;
  at: string;
  reviewer: ReviewerMeta;
  comment?: string;
}

interface HITLRecord {
  state: HITLState;
  reviewer?: ReviewerMeta;
  reviewUpdatedAt?: string;
  comment?: string;
  history: HITLHistoryEntry[];
}

interface HITLStateFile {
  version: 1;
  updatedAt: string;
  states: Record<string, HITLRecord>;
}

interface GovernanceRun {
  presetId: string;
  module: string;
  status: "success" | "partial" | "not-run";
  frameCount: number;
  tokenCount: number;
  confidence?: number;
  updatedAt: string;
  launchUrl: string;
  hitl: HITLRecord;
}

const MODULE_TO_ROUTE: Record<string, string> = {
  m1: "/m1-site-intelligence",
  m2: "/m2-capacity-matcher",
  m3: "/m3-ops-tower",
  m4: "/m4-sovereignty",
  m5: "/m5-build-tower",
  m6: "/m6-cooling-copilot",
  m7: "/m7-power-balancer",
  m8: "/m8-tenant-optimizer",
};

const HITL_STATE_PATH = path.join(process.cwd(), "src", "data", "governance", "hitl-state.json");

function defaultHITLRecord(): HITLRecord {
  return { state: "pending", history: [] };
}

function normalizeHITLRecord(raw: Partial<HITLRecord> | undefined): HITLRecord {
  if (!raw) return defaultHITLRecord();
  return {
    state: raw.state === "approved" || raw.state === "sent-back" ? raw.state : "pending",
    reviewer: raw.reviewer,
    reviewUpdatedAt: raw.reviewUpdatedAt,
    comment: raw.comment,
    history: Array.isArray(raw.history) ? raw.history : [],
  };
}

function normalizeActionToState(action: HITLAction): HITLState {
  if (action === "approve") return "approved";
  if (action === "send-back") return "sent-back";
  return "pending";
}

async function readHITLState(): Promise<HITLStateFile> {
  try {
    const raw = await fs.readFile(HITL_STATE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<HITLStateFile>;
    const states = Object.entries(parsed.states ?? {}).reduce<Record<string, HITLRecord>>((acc, [presetId, value]) => {
      acc[presetId] = normalizeHITLRecord(value as Partial<HITLRecord>);
      return acc;
    }, {});
    return {
      version: 1,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date(0).toISOString(),
      states,
    };
  } catch {
    return {
      version: 1,
      updatedAt: new Date(0).toISOString(),
      states: {},
    };
  }
}

async function writeHITLState(next: HITLStateFile): Promise<void> {
  await fs.mkdir(path.dirname(HITL_STATE_PATH), { recursive: true });
  await fs.writeFile(HITL_STATE_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
}

function launchUrlForPreset(presetId: string): string {
  const moduleId = inferModule(presetId);
  const base = MODULE_TO_ROUTE[moduleId] ?? "/";
  return `${base}?preset=${presetId}`;
}

function parsePresetFromFilename(name: string): string | null {
  const match = name.match(/^(.*)-([a-f0-9]{16})\.json$/i);
  return match?.[1] ?? null;
}

function inferModule(presetId: string): string {
  const maybe = presetId.split("-")[0];
  return /^m\d+$/.test(maybe) ? maybe : "unknown";
}

export async function GET() {
  const cacheDir = path.join(process.cwd(), "src", "data", "agent-cache");
  const hitlState = await readHITLState();
  let runs: GovernanceRun[] = [];

  try {
    const files = await fs.readdir(cacheDir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    for (const file of jsonFiles) {
      const presetId = parsePresetFromFilename(file);
      if (!presetId) continue;

      const fullPath = path.join(cacheDir, file);
      const raw = await fs.readFile(fullPath, "utf8");
      const stat = await fs.stat(fullPath);
      const parsed = JSON.parse(raw) as { frames?: Array<{ event?: string; data?: { confidence?: number } }> };
      const frames = parsed.frames ?? [];
      const tokenCount = frames.filter((f) => f.event === "token").length;
      const doneFrame = frames.find((f) => f.event === "done");
      const status: GovernanceRun["status"] = doneFrame ? "success" : frames.length > 0 ? "partial" : "not-run";
      const confidence = typeof doneFrame?.data?.confidence === "number" ? doneFrame.data.confidence : undefined;

      runs.push({
        presetId,
        module: inferModule(presetId),
        status,
        frameCount: frames.length,
        tokenCount,
        confidence,
        updatedAt: stat.mtime.toISOString(),
        launchUrl: launchUrlForPreset(presetId),
        hitl: hitlState.states[presetId] ?? defaultHITLRecord(),
      });
    }
  } catch {
    runs = [];
  }

  if (runs.length === 0) {
    runs = Object.values(PRESETS).map((p) => ({
      presetId: p.id,
      module: p.module,
      status: "not-run",
      frameCount: 0,
      tokenCount: 0,
      confidence: undefined,
      updatedAt: new Date(0).toISOString(),
      launchUrl: launchUrlForPreset(p.id),
      hitl: hitlState.states[p.id] ?? defaultHITLRecord(),
    }));
  }

  runs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const successfulRuns = runs.filter((r) => r.status === "success");
  const avgConfidence =
    successfulRuns.length > 0
      ? successfulRuns.reduce((sum, r) => sum + (r.confidence ?? 0), 0) / successfulRuns.length
      : 0;

  const modulesCovered = new Set(successfulRuns.map((r) => r.module)).size;
  const totalModules = new Set(Object.values(PRESETS).map((p) => p.module)).size;
  const approvedCount = runs.filter((r) => r.hitl.state === "approved").length;
  const sentBackCount = runs.filter((r) => r.hitl.state === "sent-back").length;

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    totals: {
      totalRuns: runs.length,
      successfulRuns: successfulRuns.length,
      avgConfidence,
      modulesCovered,
      totalModules,
      approvedCount,
      sentBackCount,
    },
    runs,
    controls: [
      { id: "citation-guard", name: "Citation Guard", state: "enabled", note: "Deterministic cite_id references enforced in sovereignty outputs." },
      { id: "cache-replay", name: "Preset Cache Replay", state: "enabled", note: "Preset hash cache reduces live-demo runtime variance." },
      {
        id: "human-approval",
        name: "Human Approval Gates",
        state: "enabled",
        note: `${approvedCount} approved · ${sentBackCount} sent-back · reviewer metadata persisted`,
      },
      { id: "model-routing", name: "Model Routing Policy", state: "enabled", note: "Sonnet for breadth, Opus for synthesis." }
    ]
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | {
        presetId?: string;
        action?: HITLAction;
        reviewer?: Partial<ReviewerMeta>;
        comment?: string;
      }
    | null;

  const presetId = body?.presetId;
  const action = body?.action;
  const reviewer = body?.reviewer;

  if (!presetId || !(presetId in PRESETS)) {
    return NextResponse.json({ ok: false, message: "Invalid presetId" }, { status: 400 });
  }
  if (!action || !["approve", "send-back", "reset"].includes(action)) {
    return NextResponse.json({ ok: false, message: "Invalid action" }, { status: 400 });
  }
  if (!reviewer?.name || !reviewer?.role) {
    return NextResponse.json({ ok: false, message: "Reviewer name and role are required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const nextState = normalizeActionToState(action);
  const fileState = await readHITLState();
  const prev = normalizeHITLRecord(fileState.states[presetId]);

  const nextRecord: HITLRecord = {
    state: nextState,
    reviewer: {
      name: reviewer.name,
      role: reviewer.role,
      reviewerId: reviewer.reviewerId,
    },
    reviewUpdatedAt: now,
    comment: typeof body?.comment === "string" ? body.comment.slice(0, 500) : undefined,
    history: [
      ...prev.history,
      {
        action,
        state: nextState,
        at: now,
        reviewer: {
          name: reviewer.name,
          role: reviewer.role,
          reviewerId: reviewer.reviewerId,
        },
        comment: typeof body?.comment === "string" ? body.comment.slice(0, 500) : undefined,
      },
    ],
  };

  const nextFile: HITLStateFile = {
    version: 1,
    updatedAt: now,
    states: {
      ...fileState.states,
      [presetId]: nextRecord,
    },
  };

  await writeHITLState(nextFile);

  return NextResponse.json({ ok: true, presetId, hitl: nextRecord });
}
