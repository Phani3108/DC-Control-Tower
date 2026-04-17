/**
 * Thin browser client for the agent proxy.
 *
 * All endpoints stream SSE events. This client exposes an async-iterable
 * interface so consumers can render agent reasoning as it arrives.
 *
 * Usage:
 *   for await (const evt of callAgent("site-debate", { sites, target })) {
 *     if (evt.event === "token") appendToken(evt.data);
 *     if (evt.event === "done") setResult(evt.data);
 *   }
 */

export type AgentEvent =
  | { event: "phase"; data: { phase: string; agent?: string } }
  | { event: "token"; data: { agent: string; delta: string } }
  | { event: "error"; data: { message: string } }
  | { event: "done"; data: unknown };

export async function* callAgent(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): AsyncGenerator<AgentEvent, void, unknown> {
  const res = await fetch(`/api/agents/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok || !res.body) {
    yield {
      event: "error",
      data: { message: `Agent proxy returned ${res.status}` },
    };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by a blank line
    let boundary: number;
    while ((boundary = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const parsed = parseSSEFrame(frame);
      if (parsed) yield parsed;
    }
  }
}

function parseSSEFrame(frame: string): AgentEvent | null {
  let event = "message";
  let data = "";
  for (const line of frame.split("\n")) {
    if (line.startsWith("event: ")) event = line.slice(7).trim();
    else if (line.startsWith("data: ")) data += line.slice(6);
  }
  if (!data) return null;
  try {
    return { event, data: JSON.parse(data) } as AgentEvent;
  } catch {
    return null;
  }
}
