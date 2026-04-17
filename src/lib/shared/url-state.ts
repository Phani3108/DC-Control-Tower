/**
 * URL-encoded scenario state.
 *
 * Design principle: every engine result is a pure function of its inputs.
 * Inputs live in the URL (base64-encoded JSON under `?s=`), so every
 * scenario is shareable, bookmarkable, back-button-replayable, and
 * deterministically demoable.
 *
 * No cookies, no localStorage, no sessions.
 */

const PARAM = "s";
const PRESET_PARAM = "preset";

export function encodeScenarioToSearch<T>(input: T): string {
  const json = JSON.stringify(input);
  // base64url — safe for URLs, no padding
  const b64 = typeof window === "undefined"
    ? Buffer.from(json, "utf8").toString("base64")
    : btoa(unescape(encodeURIComponent(json)));
  const urlSafe = b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `?${PARAM}=${urlSafe}`;
}

export function decodeScenarioFromSearch<T>(search: string): T | null {
  const params = new URLSearchParams(search);
  const raw = params.get(PARAM);
  if (!raw) return null;
  try {
    const b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
    const json = typeof window === "undefined"
      ? Buffer.from(b64, "base64").toString("utf8")
      : decodeURIComponent(escape(atob(b64)));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function getPresetId(search: string): string | null {
  return new URLSearchParams(search).get(PRESET_PARAM);
}

export function buildShareURL(origin: string, pathname: string, input: unknown): string {
  return `${origin}${pathname}${encodeScenarioToSearch(input)}`;
}
