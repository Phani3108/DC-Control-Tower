"""
FastAPI entry point — DC Control Tower agent runtime.

Owns everything that calls Claude: multi-agent debates, structured extraction,
synthesis. The Next.js front-end never sees this URL directly; all traffic
flows through the Next.js /api/agents/[...path] proxy.
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from agents import router as agents_router

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s | %(message)s",
)
log = logging.getLogger("dc-control-tower")


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("DC Control Tower agent runtime starting")
    log.info("  Opus model : %s", os.getenv("ANTHROPIC_OPUS_MODEL", "claude-opus-4-6"))
    log.info("  Sonnet model : %s", os.getenv("ANTHROPIC_SONNET_MODEL", "claude-sonnet-4-6"))
    log.info("  Cache dir : %s", os.getenv("CACHE_DIR", "./src/data/agent-cache"))
    yield
    log.info("DC Control Tower agent runtime shutting down")


app = FastAPI(
    title="DC Control Tower — Agent Runtime",
    description="Multi-agent Claude orchestration for site selection, capacity matching, ops RCA, and compliance.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS is intentionally tight — only the Next.js proxy should hit this API.
_allowed = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[_allowed],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(agents_router, prefix="/v1/agents", tags=["agents"])


@app.get("/v1/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "dc-control-tower", "version": "0.1.0"}
