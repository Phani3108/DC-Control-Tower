"""
M2 · Capacity Matcher — RFP extraction.

Sonnet-powered one-shot extraction. Takes free-form RFP text, returns a
structured M2Workload JSON.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Optional

import yaml
from fastapi import APIRouter, Body, HTTPException
from pydantic import BaseModel, Field

from .runtime import Agent, extract

log = logging.getLogger(__name__)
router = APIRouter()

_ROLES: dict[str, dict[str, Any]] = yaml.safe_load(
    (Path(__file__).parent / "roles" / "m2.yaml").read_text()
)


class Sustainability(BaseModel):
    pueMax: Optional[float] = None
    renewableMin: Optional[float] = None


class ExtractedWorkload(BaseModel):
    shape: str = Field(..., description="training | inference | mixed")
    gpu: str = Field(..., description="H100 | H200 | B200 | GB200-NVL72 | MI300X")
    clusterMW: float
    rampMW: Optional[float] = None
    latencySLAms: Optional[float] = None
    customerGeography: Optional[str] = None
    dataGeography: Optional[str] = None
    sustainability: Optional[Sustainability] = None
    budgetUSDPerMWhMax: Optional[float] = None


def _rfp_agent() -> Agent:
    cfg = _ROLES["rfp_extractor"]
    return Agent(
        role="rfp_extractor",
        model=cfg["model"],
        system_prompt=cfg["system_prompt"],
        max_tokens=600,
        temperature=0.0,
    )


@router.post("/rfp-extract")
async def rfp_extract(body: dict = Body(...)) -> dict:
    text = body.get("rfpText", "").strip()
    if not text:
        raise HTTPException(400, "rfpText required")

    try:
        workload = await extract(_rfp_agent(), ExtractedWorkload, text)
    except Exception as e:
        log.exception("rfp extract failed")
        raise HTTPException(502, f"extract failed: {e}") from e

    return {"workload": workload.model_dump(exclude_none=True)}
