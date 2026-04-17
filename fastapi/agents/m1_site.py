"""
M1 · Site Intelligence — agent router.

Takes the aggregated scorecards (produced deterministically in TypeScript on
the Next.js side) plus the site packet and runs a four-analyst debate
synthesized by the Opus IC Synthesizer.

The heavy math lives in TypeScript. This module only handles:
  * Persona definitions (role prompts in roles/m1_site.yaml)
  * Debate orchestration
  * Streaming SSE frames back through the proxy

Request body:
  {
    "question": "...",
    "input": { ... M1Input from TypeScript ... },
    "scorecards": [ ... SiteScorecard[] from runAllEngines ... ],
    "preset_id": "m1-sea-500mw"   # optional; enables cache replay
  }
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

import cache as cache_ref  # top-level module; uvicorn runs from fastapi/
from .runtime import Agent, debate

log = logging.getLogger(__name__)

router = APIRouter()

_ROLES_PATH = Path(__file__).parent / "roles" / "m1_site.yaml"
_ROLES: dict[str, dict[str, Any]] = yaml.safe_load(_ROLES_PATH.read_text())


def _agent(role_key: str) -> Agent:
    cfg = _ROLES[role_key]
    return Agent(
        role=role_key,
        model=cfg["model"],
        system_prompt=cfg["system_prompt"],
        max_tokens=1024,
        temperature=0.4,
    )


ANALYSTS = [
    _agent("power_analyst"),
    _agent("sovereignty_analyst"),
    _agent("finance_analyst"),
    _agent("climate_analyst"),
]
SYNTHESIZER = _agent("ic_synthesizer")


def _format_site_packet(scorecards: list[dict]) -> str:
    """Render a compact text packet the agents can ground on."""
    lines = []
    for c in scorecards:
        site = c["site"]
        engines = c["engineResults"]
        lines.append(f"## {site['name']} ({site['country']}) — overall {c['overallScore']:.1f}/100, rank {c['rank']}")
        lines.append(f"   5-yr TCO ≈ ${c['tco5yrUSDm']}M; blocking: {c.get('blockingFlags') or 'none'}")
        for eid, r in engines.items():
            lines.append(f"   · {eid}={r['score']}  — {r['rationale']}")
        lines.append("")
    return "\n".join(lines)


@router.post("/site-debate")
async def site_debate(body: dict = Body(...)) -> EventSourceResponse:
    question = body.get("question", "Where should we deploy the target MW?")
    scorecards = body.get("scorecards", [])
    m1_input = body.get("input", {})
    preset_id = body.get("preset_id")

    # Cache replay for interview reliability
    cached = cache_ref.read(preset_id, body) if preset_id else None
    if cached is not None:
        async def replay():
            for frame in cached.get("frames", []):
                yield {"event": frame.get("event", "message"), "data": json.dumps(frame["data"])}
                await asyncio.sleep(0.01)
        return EventSourceResponse(replay())

    packet = _format_site_packet(scorecards)
    full_question = (
        f"{question}\n\n"
        f"Target: {m1_input.get('targetMW')} MW in region {m1_input.get('region')}, "
        f"workload profile {m1_input.get('workloadProfile')}.\n\n"
        f"Site packet:\n{packet}"
    )

    async def event_gen():
        collected_frames: list[dict] = []
        async for evt in debate(
            agents=ANALYSTS,
            question=full_question,
            synthesizer=SYNTHESIZER,
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

        # Persist cache on first successful run
        if preset_id and collected_frames:
            cache_ref.write(preset_id, body, {"frames": collected_frames})

    return EventSourceResponse(event_gen())
