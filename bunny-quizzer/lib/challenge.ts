import { Difficulty, Question } from "../types";

export interface Challenge {
  /** topic */
  t: string;
  /** difficulty */
  d: Difficulty;
  /** language */
  l: string;
  /** challenger score, 0-100 */
  s: number;
  /** the exact questions */
  q: Question[];
}

function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(b64url: string): string {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeChallenge(challenge: Challenge): string {
  return toBase64Url(JSON.stringify(challenge));
}

export function decodeChallenge(param: string): Challenge | null {
  try {
    const parsed = JSON.parse(fromBase64Url(param));
    if (
      parsed &&
      typeof parsed.t === "string" &&
      Array.isArray(parsed.q) &&
      parsed.q.length > 0
    ) {
      return parsed as Challenge;
    }
    return null;
  } catch {
    return null;
  }
}

export function challengeUrl(challenge: Challenge): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}?challenge=${encodeChallenge(challenge)}`;
}

export function readChallengeFromUrl(): Challenge | null {
  try {
    const param = new URLSearchParams(window.location.search).get("challenge");
    return param ? decodeChallenge(param) : null;
  } catch {
    return null;
  }
}

export function clearChallengeFromUrl(): void {
  try {
    window.history.replaceState(
      {},
      "",
      `${window.location.origin}${window.location.pathname}`
    );
  } catch {
    /* ignore */
  }
}
