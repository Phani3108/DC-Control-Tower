"""
M7 · Power Balancing Copilot — grid and dispatch optimization debate.

Endpoint:
  * /power-balance — 3-agent Sonnet debate + Opus synthesizer (SSE)

Input body is produced by the M7 deterministic engine and includes:
  - power scenario controls (load, reserve policy, supply envelope)
  - dispatch plan by time window
  - ranked grid and market risks
  - blended cost and annual spend metrics
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
    (Path(__file__).parent / "roles" / "m7_power.yaml").read_text()
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
    power_input = body.get("input", {})
    dispatch = body.get("dispatchPlan", [])
    risks = body.get("gridRisks", [])

    top_risks = sorted(risks, key=lambda r: r.get("exposureScore", 0), reverse=True)[:4]

    lines = [
        f"Facility: {power_input.get('facilityName')} ({power_input.get('facilityId')})",
        (
            "Scenario controls: "
            f"targetITMW={power_input.get('targetITMW')}, "
            f"pue={power_input.get('pue')}, "
            f"utilityFeedMW={power_input.get('utilityFeedMW')}, "
            f"onsiteGenerationMW={power_input.get('onsiteGenerationMW')}, "
            f"batteryMWh={power_input.get('batteryMWh')}, "
            f"contractMode={power_input.get('contractMode')}, "
            f"reservePolicy={power_input.get('reservePolicy')}, "
            f"spotPriceUSDPerMWh={power_input.get('spotPriceUSDPerMWh')}"
        ),
        (
            "Power metrics: "
            f"grossFacilityMW={body.get('grossFacilityMW')}, "
            f"firmAvailableMW={body.get('firmAvailableMW')}, "
            f"reserveHeadroomMW={body.get('reserveHeadroomMW')}, "
            f"curtailedLoadMW={body.get('curtailedLoadMW')}, "
            f"batteryRuntimeMinAtDeficit={body.get('batteryRuntimeMinAtDeficit')}, "
            f"blendedPowerCostUSDPerMWh={body.get('blendedPowerCostUSDPerMWh')}, "
            f"annualPowerCostUSDm={body.get('annualPowerCostUSDm')}"
        ),
        "",
        "Dispatch plan:",
    ]

    for slot in dispatch:
        lines.append(
            (
                f"- {slot.get('label')}: utilityMW={slot.get('utilityMW')}, "
                f"onsiteMW={slot.get('onsiteMW')}, "
                f"batteryDischargeMW={slot.get('batteryDischargeMW')}, "
                f"expectedMarginMW={slot.get('expectedMarginMW')}, "
                f"marginalCostUSDPerMWh={slot.get('marginalCostUSDPerMWh')}"
            )
        )

    lines.append("")
    lines.append("Top grid risks:")
    for risk in top_risks:
        lines.append(
            (
                f"- {risk.get('title')}: prob={risk.get('probabilityPct')}%, "
                f"impactMW={risk.get('impactMW')}, "
                f"exposureScore={risk.get('exposureScore')}"
            )
        )

    lines.append("")
    lines.append(
        "Decision requested: what power-dispatch and reserve actions should run this week to minimize outage exposure and cost volatility?"
    )

    return "\n".join(lines)


@router.post("/power-balance")
async def power_balance(body: dict = Body(...)) -> EventSourceResponse:
    preset_id = body.get("preset_id")
    cached = cache_ref.read(preset_id, body) if preset_id else None
    if cached is not None:
        async def replay():
            for frame in cached.get("frames", []):
                yield {"event": frame.get("event", "message"), "data": json.dumps(frame["data"])}
                await asyncio.sleep(0.01)
        return EventSourceResponse(replay())

    analysts = [
        _agent("grid_operations_analyst"),
        _agent("market_dispatch_analyst"),
        _agent("resiliency_analyst"),
    ]
    synthesizer = _agent("power_synthesizer", max_tokens=1200, temperature=0.3)
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
