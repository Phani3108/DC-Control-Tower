"""
Shared multi-agent runtime.

Three primitives, used by every module:

* `Agent(role, model, system_prompt, tools=[])` — named persona. Model is
  either the Opus or Sonnet alias resolved from env.
* `debate(agents, question, rounds, synthesizer)` — round-robin debate with
  shared scratchpad; the synthesizer (always Opus) renders the final
  decision + confidence + dissents.
* `extract(agent, schema, user_input)` — structured JSON extraction via
  Sonnet, validated against a Pydantic model.

Routing policy:
* Sonnet for bulk / structured / extraction work.
* Opus only at synthesis / final reasoning. One Opus call per flow keeps
  cost predictable.

All flows are designed to stream via Server-Sent Events so the UI can
render agent reasoning as it arrives.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
from dataclasses import dataclass, field
from typing import Any, AsyncIterator, Literal, Sequence, TypeVar

from anthropic import AsyncAnthropic
from pydantic import BaseModel, ValidationError

log = logging.getLogger(__name__)

ModelAlias = Literal["opus", "sonnet"]

_client: AsyncAnthropic | None = None


def client() -> AsyncAnthropic:
    global _client
    if _client is None:
        _client = AsyncAnthropic()  # reads ANTHROPIC_API_KEY from env
    return _client


def resolve_model(alias: ModelAlias) -> str:
    if alias == "opus":
        return os.getenv("ANTHROPIC_OPUS_MODEL", "claude-opus-4-6")
    return os.getenv("ANTHROPIC_SONNET_MODEL", "claude-sonnet-4-6")


# ---------------------------------------------------------------------------
# Agent
# ---------------------------------------------------------------------------


@dataclass
class Agent:
    """A named persona configured for a specific module."""

    role: str
    model: ModelAlias
    system_prompt: str
    max_tokens: int = 2048
    temperature: float = 0.4
    tools: list[dict] = field(default_factory=list)

    async def speak(
        self,
        conversation: Sequence[dict[str, str]],
    ) -> AsyncIterator[dict[str, Any]]:
        """Stream a single turn. Yields `{"type": "token"|"done", ...}` frames."""
        model_id = resolve_model(self.model)
        try:
            async with client().messages.stream(
                model=model_id,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                system=self.system_prompt,
                messages=list(conversation),
            ) as stream:
                full = []
                async for text in stream.text_stream:
                    full.append(text)
                    yield {"type": "token", "agent": self.role, "delta": text}
                yield {
                    "type": "done",
                    "agent": self.role,
                    "content": "".join(full),
                    "model": model_id,
                }
        except Exception as e:  # pragma: no cover - network-flaky path
            log.exception("Agent %s failed", self.role)
            yield {"type": "error", "agent": self.role, "message": str(e)}


# ---------------------------------------------------------------------------
# Debate
# ---------------------------------------------------------------------------


@dataclass
class DebateTurn:
    phase: Literal["opening", "rebuttal", "synthesis"]
    agent: str
    content: str


async def debate(
    agents: Sequence[Agent],
    question: str,
    synthesizer: Agent,
    rounds: int = 1,
) -> AsyncIterator[dict[str, Any]]:
    """
    Multi-agent round-robin debate streamed as SSE-ready frames.

    Shape:
      phase=opening    -> each agent speaks once on `question`
      phase=rebuttal   -> each agent sees prior turns and rebuts (for r>1)
      phase=synthesis  -> Opus synthesizer renders decision + dissents
    """
    transcript: list[DebateTurn] = []

    async def _run(phase: Literal["opening", "rebuttal"], agent: Agent) -> None:
        yield_phase = {"type": "phase", "phase": phase, "agent": agent.role}
        yield_queue.put_nowait(yield_phase)

        prior_context = (
            "\n\n".join(f"[{t.agent} · {t.phase}]\n{t.content}" for t in transcript)
            if transcript
            else "(no prior turns)"
        )

        user_msg = {
            "role": "user",
            "content": (
                f"Question:\n{question}\n\n"
                f"Prior turns:\n{prior_context}\n\n"
                f"Respond in 120–180 words. Be opinionated; flag disagreements with prior turns."
            ),
        }

        buf: list[str] = []
        async for frame in agent.speak([user_msg]):
            if frame["type"] == "token":
                buf.append(frame["delta"])
                yield_queue.put_nowait(frame)
            elif frame["type"] == "done":
                transcript.append(DebateTurn(phase=phase, agent=agent.role, content="".join(buf)))
            elif frame["type"] == "error":
                yield_queue.put_nowait(frame)

    yield_queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue()

    async def _drive() -> None:
        try:
            # Opening round
            for a in agents:
                await _run("opening", a)
            # Optional rebuttal rounds
            for _ in range(max(0, rounds - 1)):
                for a in agents:
                    await _run("rebuttal", a)
            # Synthesis
            yield_queue.put_nowait({"type": "phase", "phase": "synthesis", "agent": synthesizer.role})
            synth_prompt = {
                "role": "user",
                "content": (
                    f"Question:\n{question}\n\n"
                    f"Debate transcript:\n"
                    + "\n\n".join(f"[{t.agent} · {t.phase}]\n{t.content}" for t in transcript)
                    + "\n\n"
                    "Produce a JSON object with keys: "
                    "`decision` (string, ≤200 words, executive tone), "
                    "`confidence` (0..1 float), "
                    "`dissents` (list of short strings — one per agent whose view was overridden), "
                    "`key_drivers` (list of strings). "
                    "Return ONLY valid JSON with no code fences."
                ),
            }
            buf: list[str] = []
            async for frame in synthesizer.speak([synth_prompt]):
                if frame["type"] == "token":
                    buf.append(frame["delta"])
                    yield_queue.put_nowait(frame)
                elif frame["type"] == "done":
                    raw = "".join(buf).strip()
                    try:
                        parsed = json.loads(raw)
                    except json.JSONDecodeError:
                        parsed = {"decision": raw, "confidence": 0.5, "dissents": [], "key_drivers": []}
                    yield_queue.put_nowait(
                        {
                            "type": "done",
                            "result": parsed,
                            "transcript": [t.__dict__ for t in transcript],
                        },
                    )
                elif frame["type"] == "error":
                    yield_queue.put_nowait(frame)
        except Exception as e:  # pragma: no cover
            log.exception("debate failed")
            yield_queue.put_nowait({"type": "error", "message": str(e)})
        finally:
            yield_queue.put_nowait({"type": "__end__"})

    asyncio.create_task(_drive())

    while True:
        frame = await yield_queue.get()
        if frame.get("type") == "__end__":
            return
        yield frame


# ---------------------------------------------------------------------------
# Extract (structured JSON, Sonnet)
# ---------------------------------------------------------------------------

T = TypeVar("T", bound=BaseModel)


async def extract(
    agent: Agent,
    schema: type[T],
    user_input: str,
) -> T:
    """One-shot structured extraction validated against a Pydantic model."""
    prompt = {
        "role": "user",
        "content": (
            f"Extract the following information from the input.\n"
            f"Return ONLY a valid JSON object matching this schema (no prose, no code fences):\n"
            f"{schema.model_json_schema()}\n\n"
            f"Input:\n{user_input}"
        ),
    }

    model_id = resolve_model(agent.model)
    msg = await client().messages.create(
        model=model_id,
        max_tokens=agent.max_tokens,
        temperature=0.0,
        system=agent.system_prompt,
        messages=[prompt],
    )
    raw = "".join(block.text for block in msg.content if getattr(block, "type", None) == "text").strip()
    # Tolerate models that wrap in ```json
    if raw.startswith("```"):
        raw = raw.strip("`").split("\n", 1)[-1].rsplit("```", 1)[0]
    try:
        return schema.model_validate_json(raw)
    except ValidationError as e:
        log.warning("extract schema mismatch: %s\nRaw: %s", e, raw[:300])
        raise
