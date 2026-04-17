"""
M4 · Sovereignty Grid — agent router.

Takes the deterministic TypeScript-side assessments + facility routing and
runs per-jurisdiction narrative reasoning (Sonnet) followed by synthesis
into a compliance brief (Opus).

The synthesizer is constrained to reference only `cite_id`s from the
input — the YAML system prompt spells this out explicitly.
"""
from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path
from typing import Any

import yaml
from fastapi import APIRouter, Body
from sse_starlette.sse import EventSourceResponse

import cache as cache_ref
from .runtime import Agent, debate

log = logging.getLogger(__name__)
router = APIRouter()

_ROLES_PATH = Path(__file__).parent / "roles" / "m4_compliance.yaml"
_ROLES: dict[str, dict[str, Any]] = yaml.safe_load(_ROLES_PATH.read_text())


def _agent(role_key: str, display_suffix: str = "") -> Agent:
    cfg = _ROLES[role_key]
    role = role_key + (f"__{display_suffix}" if display_suffix else "")
    return Agent(
        role=role,
        model=cfg["model"],
        system_prompt=cfg["system_prompt"],
        max_tokens=900,
        temperature=0.3,
    )


def _build_question(body: dict) -> str:
    m4_input = body.get("input", {})
    assessments = body.get("assessments", [])
    routing = body.get("routing", [])

    lines = [
        f"Workload category: {m4_input.get('workloadCategory')}",
        f"Customer data countries: {', '.join(m4_input.get('customerDataCountries', []) or ['—'])}",
        "",
        "## Deterministic classifier output (per jurisdiction)",
    ]
    for a in assessments:
        lines.append(
            f"- {a['jurisdiction']} ({a['country']}): {a['verdict'].upper()}; "
            f"blocking={a.get('blockingCiteIds') or '—'}; "
            f"gating={a.get('gatingCiteIds') or '—'}; {a.get('notes', '')}"
        )
    lines.append("")
    lines.append("## Facility routing (deterministic)")
    for i, r in enumerate(routing, 1):
        lines.append(
            f"{i}. {r['facilityName']} ({r['country']}) — {r['verdict'].upper()} "
            f"(fit {r['fitScore']}) · conditions: {r.get('conditionalOn') or '—'}"
        )

    lines.append("")
    lines.append(
        "Decision requested: confirm the routing, flag any dissents, and cite only cite_ids already present above."
    )
    return "\n".join(lines)


@router.post("/compliance-reason")
async def compliance_reason(body: dict = Body(...)) -> EventSourceResponse:
    assessments = body.get("assessments", [])
    preset_id = body.get("preset_id")

    cached = cache_ref.read(preset_id, body) if preset_id else None
    if cached is not None:
        async def replay():
            for frame in cached.get("frames", []):
                yield {"event": frame.get("event", "message"), "data": json.dumps(frame["data"])}
                await asyncio.sleep(0.01)
        return EventSourceResponse(replay())

    # One JurisdictionAnalyst per assessed jurisdiction
    analysts = [
        _agent("jurisdiction_analyst", a.get("jurisdiction", f"j{i}"))
        for i, a in enumerate(assessments)
    ]
    if not analysts:
        # Still provide a single analyst so the debate has someone to speak
        analysts = [_agent("jurisdiction_analyst", "default")]

    synthesizer = _agent("compliance_synthesizer")
    question = _build_question(body)

    async def event_gen():
        collected_frames: list[dict] = []
        async for evt in debate(
            agents=analysts,
            question=question,
            synthesizer=synthesizer,
            rounds=1,
        ):
            t = evt.get("type")
            if t == "phase":
                data = {"phase": evt.get("phase"), "agent": evt.get("agent")}
                collected_frames.append({"event": "phase", "data": data})
                yield {"event": "phase", "data": json.dumps(data)}
            elif t == "token":
                data = {"agent": evt["agent"], "delta": evt["delta"]}
                collected_frames.append({"event": "token", "data": data})
                yield {"event": "token", "data": json.dumps(data)}
            elif t == "done":
                data = evt.get("result") or evt
                collected_frames.append({"event": "done", "data": data})
                yield {"event": "done", "data": json.dumps(data)}
            elif t == "error":
                yield {"event": "error", "data": json.dumps({"message": evt.get("message", "unknown")})}

        if preset_id and collected_frames:
            cache_ref.write(preset_id, body, {"frames": collected_frames})

    return EventSourceResponse(event_gen())
