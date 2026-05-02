"""Agent runtime package — shared primitives + per-module routers."""
from __future__ import annotations

from fastapi import APIRouter

from .runtime import Agent, debate, extract, ModelAlias  # re-exports
from . import m1_site, m4_compliance, m2_rfp, m2_proposal, m3_rca, m5_build, m6_cooling, m7_power, m8_tenant

router = APIRouter()
router.include_router(m1_site.router)
router.include_router(m4_compliance.router)
router.include_router(m2_rfp.router)
router.include_router(m2_proposal.router)
router.include_router(m3_rca.router)
router.include_router(m5_build.router)
router.include_router(m6_cooling.router)
router.include_router(m7_power.router)
router.include_router(m8_tenant.router)


@router.post("/smoke")
async def smoke() -> dict:
    """Kept alongside real module routers for debugging."""
    return {"ok": True, "message": "Agent runtime is up."}


__all__ = ["router", "Agent", "debate", "extract", "ModelAlias"]
