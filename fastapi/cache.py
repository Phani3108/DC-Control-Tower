"""
Disk cache for agent responses keyed by preset hash.

Purpose: interview reliability. Once a preset has been successfully run,
subsequent runs replay from cache — no Anthropic API calls, no network
variance, no surprise rate limits during live demos.

Cache key = sha256(preset_id + input_json). Values are JSON files written
atomically (temp file + rename).
"""
from __future__ import annotations

import hashlib
import json
import logging
import os
import tempfile
from pathlib import Path
from typing import Any

log = logging.getLogger(__name__)

_DEFAULT = Path(__file__).resolve().parent.parent / "src" / "data" / "agent-cache"


def _cache_dir() -> Path:
    d = Path(os.getenv("CACHE_DIR", str(_DEFAULT)))
    d.mkdir(parents=True, exist_ok=True)
    return d


def cache_key(preset_id: str, payload: Any) -> str:
    blob = json.dumps({"preset": preset_id, "payload": payload}, sort_keys=True).encode()
    return hashlib.sha256(blob).hexdigest()[:16]


def read(preset_id: str, payload: Any) -> dict | None:
    d = _cache_dir()
    path = d / f"{preset_id}-{cache_key(preset_id, payload)}.json"
    if not path.exists():
        # Demo fallback: allow a pre-seeded fixture for this preset even when
        # payload shape changes slightly between UI revisions.
        candidates = sorted(d.glob(f"{preset_id}-*.json"))
        if not candidates:
            return None
        path = candidates[-1]
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError:
        log.warning("corrupt cache entry %s", path)
        return None


def write(preset_id: str, payload: Any, value: dict) -> None:
    d = _cache_dir()
    path = d / f"{preset_id}-{cache_key(preset_id, payload)}.json"
    with tempfile.NamedTemporaryFile("w", delete=False, dir=d, suffix=".tmp") as f:
        json.dump(value, f, indent=2)
        tmp = Path(f.name)
    tmp.replace(path)
