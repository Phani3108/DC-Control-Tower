"""
M3 · Ops Control Tower — RCA debate and NL query.

Two endpoints:
  * /rca        — 3-agent Sonnet debate + Opus synthesizer (streamed SSE)
  * /nl-query   — single-turn Opus query grounded on a telemetry snapshot
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
from .runtime import Agent, debate, client, resolve_model

log = logging.getLogger(__name__)
router = APIRouter()

_ROLES: dict[str, dict[str, Any]] = yaml.safe_load(
    (Path(__file__).parent / "roles" / "m3.yaml").read_text()
)


def _agent(key: str, max_tokens: int = 800, temperature: float = 0.35) -> Agent:
    cfg = _ROLES[key]
    return Agent(
        role=key,
        model=cfg["model"],
        system_prompt=cfg["system_prompt"],
        max_tokens=max_tokens,
        temperature=temperature,
    )


def _summarize_telemetry(body: dict) -> str:
    series = body.get("series", {})
    anomalies = body.get("anomalies", [])[-25:]
    failures = body.get("failureRisks", [])
    points = series.get("points", [])
    first = points[0] if points else {}
    last = points[-1] if points else {}

    lines = [
        f"Incident: {series.get('incidentId')} at {series.get('zone')} ({series.get('facility')})",
        f"Window: {series.get('startTime')} → {series.get('endTime')}",
        f"Baseline start: {json.dumps({k: first.get(k) for k in ['powerKW','inletTempC','outletTempC','latencyP99Ms','pduLoadPct']})}",
        f"Latest snapshot: {json.dumps({k: last.get(k) for k in ['powerKW','inletTempC','outletTempC','latencyP99Ms','pduLoadPct']})}",
        f"CRAC latest: {last.get('crac')}",
        "",
        "Recent anomalies (z-score, severity):",
    ]
    for a in anomalies:
        lines.append(f"  - {a['t']}: {a['metric']}={a['value']} z={a['zscore']} [{a['severity']}]")
    lines.append("")
    lines.append("Failure-risk forecast (6-hour horizon):")
    for f in failures:
        lines.append(f"  - {f['component']}: {f['probabilityPct']}% · drivers={f['drivers']}")
    return "\n".join(lines)


@router.post("/rca")
async def rca(body: dict = Body(...)) -> EventSourceResponse:
    preset_id = body.get("preset_id")
    cached = cache_ref.read(preset_id, body) if preset_id else None
    if cached is not None:
        async def replay():
            for frame in cached.get("frames", []):
                yield {"event": frame.get("event", "message"), "data": json.dumps(frame["data"])}
                await asyncio.sleep(0.01)
        return EventSourceResponse(replay())

    agents = [_agent("ops_agent"), _agent("infra_agent"), _agent("risk_agent")]
    synth = _agent("rca_synthesizer", max_tokens=1200)
    question = (
        f"Telemetry + anomaly summary:\n\n{_summarize_telemetry(body)}\n\n"
        f"Question: what is the root cause, what's the immediate mitigation, and what's at risk in the next 6 hours?"
    )

    async def event_gen():
        collected: list[dict] = []
        async for evt in debate(agents=agents, question=question, synthesizer=synth, rounds=1):
            t = evt.get("type")
            if t == "phase":
                data = {"phase": evt.get("phase"), "agent": evt.get("agent")}
                collected.append({"event": "phase", "data": data})
                yield {"event": "phase", "data": json.dumps(data)}
            elif t == "token":
                data = {"agent": evt["agent"], "delta": evt["delta"]}
                collected.append({"event": "token", "data": data})
                yield {"event": "token", "data": json.dumps(data)}
            elif t == "done":
                data = evt.get("result") or evt
                collected.append({"event": "done", "data": data})
                yield {"event": "done", "data": json.dumps(data)}
            elif t == "error":
                yield {"event": "error", "data": json.dumps({"message": evt.get("message", "unknown")})}

        if preset_id and collected:
            cache_ref.write(preset_id, body, {"frames": collected})

    return EventSourceResponse(event_gen())


@router.post("/nl-query")
async def nl_query(body: dict = Body(...)) -> EventSourceResponse:
    question = body.get("question", "")
    summary = _summarize_telemetry(body)
    agent = _agent("nl_query_agent", max_tokens=900, temperature=0.3)
    model = resolve_model(agent.model)
    prompt = (
        f"Telemetry & anomaly summary:\n{summary}\n\n"
        f"Failure-risk forecast: {json.dumps(body.get('failureRisks', []))}\n\n"
        f"Simulations: {json.dumps(body.get('simulations', []))}\n\n"
        f"User question: {question}"
    )

    async def event_gen():
        yield {"event": "phase", "data": json.dumps({"phase": "answering", "agent": agent.role})}
        async with client().messages.stream(
            model=model,
            max_tokens=agent.max_tokens,
            temperature=agent.temperature,
            system=agent.system_prompt,
            messages=[{"role": "user", "content": prompt}],
        ) as stream:
            async for text in stream.text_stream:
                yield {"event": "token", "data": json.dumps({"agent": agent.role, "delta": text})}
        yield {"event": "done", "data": json.dumps({"ok": True})}

    return EventSourceResponse(event_gen())
