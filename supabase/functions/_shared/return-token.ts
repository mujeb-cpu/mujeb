import { env } from "./http.ts";

const encoder = new TextEncoder();

function base64url(value: Uint8Array | string) {
  const bytes = typeof value === "string" ? encoder.encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function decode(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

async function signature(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(env("RETURN_TOKEN_SECRET")),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  return base64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload))));
}

export async function signReturnFacts(facts: unknown) {
  const payload = base64url(JSON.stringify({ facts, exp: Date.now() + 15 * 60_000 }));
  return `${payload}.${await signature(payload)}`;
}

/**
 * Constant-time string comparison.
 *
 * `a !== b` short-circuits on the first differing byte, so rejecting a token
 * takes longer the more of the signature an attacker has guessed correctly.
 * That leak lets a signature be brute-forced byte by byte instead of all at
 * once. Comparing every byte keeps the timing flat.
 */
function timingSafeEqual(expected: string, actual: string) {
  const left = encoder.encode(expected);
  const right = encoder.encode(actual);
  // Fold the length difference in rather than returning early, and always walk
  // the full expected length so the loop count never depends on the input.
  let mismatch = left.length ^ right.length;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left[index] ^ (right[index] ?? 0);
  }
  return mismatch === 0;
}

export async function verifyReturnFacts<T>(token: string): Promise<T> {
  const [payload, received] = token.split(".");
  if (!payload || !received) throw new Error("invalid_return_token");
  if (!timingSafeEqual(await signature(payload), received)) {
    throw new Error("invalid_return_token");
  }
  const parsed = JSON.parse(decode(payload));
  if (!parsed.exp || parsed.exp < Date.now()) throw new Error("expired_return_token");
  return parsed.facts as T;
}
