"""
M2 · Capacity Matcher — proposal writer.

Single Opus call (not a debate — the TS side has already ranked facilities
deterministically). Streams the proposal narrative as SSE.
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
from .runtime import Agent, resolve_model, client

log = logging.getLogger(__name__)
router = APIRouter()

_ROLES: dict[str, dict[str, Any]] = yaml.safe_load(
    (Path(__file__).parent / "roles" / "m2.yaml").read_text()
)


def _writer() -> Agent:
    cfg = _ROLES["proposal_writer"]
    return Agent(
        role="proposal_writer",
        model=cfg["model"],
        system_prompt=cfg["system_prompt"],
        max_tokens=1400,
        temperature=0.3,
    )


def _build_prompt(body: dict) -> str:
    return (
        f"## Extracted workload\n{json.dumps(body.get('workload', {}), indent=2)}\n\n"
        f"## Top facility fits (deterministic)\n{json.dumps(body.get('fits', [])[:3], indent=2)}\n\n"
        f"## Cost breakdown (primary)\n{json.dumps(body.get('primaryCost', {}), indent=2)}\n\n"
        f"## SLA draft\n{json.dumps(body.get('sla', {}), indent=2)}\n\n"
        f"## Competitor comparisons\n{json.dumps(body.get('comparisons', []), indent=2)}\n\n"
        f"Produce the proposal JSON per your system prompt."
    )


@router.post("/proposal-draft")
async def proposal_draft(body: dict = Body(...)) -> EventSourceResponse:
    preset_id = body.get("preset_id")
    cached = cache_ref.read(preset_id, body) if preset_id else None
    if cached is not None:
        async def replay():
            for frame in cached.get("frames", []):
                yield {"event": frame.get("event", "message"), "data": json.dumps(frame["data"])}
                await asyncio.sleep(0.01)
        return EventSourceResponse(replay())

    writer = _writer()
    model = resolve_model(writer.model)
    prompt = _build_prompt(body)

    async def event_gen():
        collected: list[dict] = []
        yield {"event": "phase", "data": json.dumps({"phase": "writing", "agent": writer.role})}
        buf: list[str] = []
        async with client().messages.stream(
            model=model,
            max_tokens=writer.max_tokens,
            temperature=writer.temperature,
            system=writer.system_prompt,
            messages=[{"role": "user", "content": prompt}],
        ) as stream:
            async for text in stream.text_stream:
                buf.append(text)
                data = {"agent": writer.role, "delta": text}
                collected.append({"event": "token", "data": data})
                yield {"event": "token", "data": json.dumps(data)}

        raw = "".join(buf).strip()
        if raw.startswith("```"):
            raw = raw.strip("`").split("\n", 1)[-1].rsplit("```", 1)[0]
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            parsed = {
                "decision": raw,
                "confidence": 0.5,
                "dissents": [],
                "key_drivers": [],
            }
        done = {"event": "done", "data": parsed}
        collected.append(done)
        yield {"event": "done", "data": json.dumps(parsed)}

        if preset_id and collected:
            cache_ref.write(preset_id, body, {"frames": collected})

    return EventSourceResponse(event_gen())
