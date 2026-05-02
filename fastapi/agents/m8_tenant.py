"""
M8 · Tenant Fit and Revenue Optimizer — commercial synthesis debate.

Endpoint:
  * /tenant-optimize — 3-agent Sonnet debate + Opus synthesizer (SSE)

Input body is produced by the M8 deterministic engine and includes:
  - tenant-fit and pricing scenario controls
  - ranked tenant archetype fit with revenue and margin outputs
  - scenario envelope with downside/base/upside outcomes
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
    (Path(__file__).parent / "roles" / "m8_tenant.yaml").read_text()
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
    tenant_input = body.get("input", {})
    tenant_fits = body.get("tenantFits", [])
    scenarios = body.get("revenueScenarios", [])

    top_fits = sorted(tenant_fits, key=lambda t: t.get("annualRevenueUSDm", 0), reverse=True)[:4]

    lines = [
        f"Facility: {tenant_input.get('facilityName')} ({tenant_input.get('facilityId')})",
        (
            "Scenario controls: "
            f"availableMW={tenant_input.get('availableMW')}, "
            f"committedMW={tenant_input.get('committedMW')}, "
            f"targetGpu={tenant_input.get('targetGpu')}, "
            f"pricingMode={tenant_input.get('pricingMode')}, "
            f"contractTermYears={tenant_input.get('contractTermYears')}, "
            f"renewablePremiumPct={tenant_input.get('renewablePremiumPct')}, "
            f"financingCostPct={tenant_input.get('financingCostPct')}, "
            f"targetGrossMarginPct={tenant_input.get('targetGrossMarginPct')}"
        ),
        (
            "Commercial metrics: "
            f"sellableMW={body.get('sellableMW')}, "
            f"unallocatedMW={body.get('unallocatedMW')}, "
            f"weightedPriceUSDPerMWh={body.get('weightedPriceUSDPerMWh')}, "
            f"totalProjectedRevenueUSDm={body.get('totalProjectedRevenueUSDm')}, "
            f"weightedGrossMarginPct={body.get('weightedGrossMarginPct')}, "
            f"paybackMonthsP50={body.get('paybackMonthsP50')}, "
            f"paybackMonthsP90={body.get('paybackMonthsP90')}"
        ),
        "",
        "Tenant fit shortlist:",
    ]

    for tenant in top_fits:
        lines.append(
            (
                f"- {tenant.get('archetype')}: requiredMW={tenant.get('requiredMW')}, "
                f"fitScore={tenant.get('fitScore')}, "
                f"expectedPriceUSDPerMWh={tenant.get('expectedPriceUSDPerMWh')}, "
                f"annualRevenueUSDm={tenant.get('annualRevenueUSDm')}, "
                f"grossMarginPct={tenant.get('grossMarginPct')}, "
                f"risk={tenant.get('risk')}"
            )
        )

    lines.append("")
    lines.append("Scenario envelope:")
    for scenario in scenarios:
        lines.append(
            (
                f"- {scenario.get('label')}: revenueUSDm={scenario.get('annualRevenueUSDm')}, "
                f"marginPct={scenario.get('grossMarginPct')}, "
                f"occupancyPct={scenario.get('occupancyPct')}"
            )
        )

    lines.append("")
    lines.append(
        "Decision requested: what tenant mix and pricing actions should run this quarter to maximize durable revenue while preserving margin quality?"
    )

    return "\n".join(lines)


@router.post("/tenant-optimize")
async def tenant_optimize(body: dict = Body(...)) -> EventSourceResponse:
    preset_id = body.get("preset_id")
    cached = cache_ref.read(preset_id, body) if preset_id else None
    if cached is not None:
        async def replay():
            for frame in cached.get("frames", []):
                yield {"event": frame.get("event", "message"), "data": json.dumps(frame["data"])}
                await asyncio.sleep(0.01)
        return EventSourceResponse(replay())

    analysts = [
        _agent("commercial_strategy_analyst"),
        _agent("pricing_analyst"),
        _agent("risk_underwriting_analyst"),
    ]
    synthesizer = _agent("tenant_synthesizer", max_tokens=1200, temperature=0.3)
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
