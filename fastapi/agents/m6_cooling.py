"""
M6 · Cooling Copilot — cooling optimization debate.

Endpoint:
  * /cooling-optimize — 3-agent Sonnet debate + Opus synthesizer (SSE)

Input body is produced by the M6 deterministic engine and includes:
  - facility cooling scenario controls
  - setpoint plan by zone
  - ranked thermal hotspot risks
  - current and optimized PUE metrics
"""
from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any

import yaml
from fastapi import APIRouter, Body
from sse_starlette.sse import EventSourceResponse

import cache as cache_ref
from .runtime import Agent, debate

router = APIRouter()

_ROLES: dict[str, dict[str, Any]] = yaml.safe_load(
    (Path(__file__).parent / "roles" / "m6_cooling.yaml").read_text()
)


def _agent(key: str, max_tokens: int = 850, temperature: float = 0.35) -> Agent:
    cfg = _ROLES[key]
    return Agent(
        role=key,
        model=cfg["model"],
        system_prompt=cfg["system_prompt"],
        max_tokens=max_tokens,
        temperature=temperature,
    )


def _build_packet(body: dict) -> str:
    cooling_input = body.get("input", {})
    setpoints = body.get("setpointPlan", [])
    risks = body.get("hotspotRisks", [])

    top_risks = sorted(risks, key=lambda r: r.get("exposureScore", 0), reverse=True)[:4]

    lines = [
        f"Facility: {cooling_input.get('facilityName')} ({cooling_input.get('facilityId')})",
        (
            "Scenario controls: "
            f"targetITMW={cooling_input.get('targetITMW')}, "
            f"ambientTempC={cooling_input.get('ambientTempC')}, "
            f"humidityPct={cooling_input.get('humidityPct')}, "
            f"coolingMode={cooling_input.get('coolingMode')}, "
            f"rackDensityKW={cooling_input.get('rackDensityKW')}, "
            f"redundancyTier={cooling_input.get('redundancyTier')}, "
            f"pueTarget={cooling_input.get('pueTarget')}"
        ),
        (
            "PUE metrics: "
            f"current={body.get('currentPUE')}, "
            f"optimizedP50={body.get('optimizedPUEP50')}, "
            f"optimizedP90={body.get('optimizedPUEP90')}, "
            f"coolingEnergySavingsPct={body.get('coolingEnergySavingsPct')}, "
            f"annualSavingsUSDm={body.get('annualSavingsUSDm')}"
        ),
        "",
        "Setpoint plan:",
    ]

    for zone in setpoints:
        lines.append(
            (
                f"- {zone.get('zoneName')}: supplyTempC={zone.get('supplyTempC')}, "
                f"fanSpeedPct={zone.get('fanSpeedPct')}, "
                f"chillerLoadPct={zone.get('chillerLoadPct')}, "
                f"expectedPUE={zone.get('expectedPUE')}"
            )
        )

    lines.append("")
    lines.append("Top thermal risks:")
    for risk in top_risks:
        lines.append(
            (
                f"- {risk.get('title')}: prob={risk.get('probabilityPct')}%, "
                f"impactTempC={risk.get('impactTempC')}, "
                f"exposureScore={risk.get('exposureScore')}"
            )
        )

    lines.append("")
    lines.append(
        "Decision requested: what cooling-control actions should run this week to improve PUE while protecting thermal reliability?"
    )

    return "\n".join(lines)


@router.post("/cooling-optimize")
async def cooling_optimize(body: dict = Body(...)) -> EventSourceResponse:
    preset_id = body.get("preset_id")
    cached = cache_ref.read(preset_id, body) if preset_id else None
    if cached is not None:
        async def replay():
            for frame in cached.get("frames", []):
                yield {"event": frame.get("event", "message"), "data": json.dumps(frame["data"])}
                await asyncio.sleep(0.01)
        return EventSourceResponse(replay())

    analysts = [
        _agent("hvac_analyst"),
        _agent("thermal_modeling_analyst"),
        _agent("cooling_finops_analyst"),
    ]
    synthesizer = _agent("cooling_synthesizer", max_tokens=1200, temperature=0.3)
    question = _build_packet(body)

    async def event_gen():
        collected: list[dict] = []
        async for evt in debate(agents=analysts, question=question, synthesizer=synthesizer, rounds=1):
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
