// HMAC-signed session cookie for INTERNS. Separate from the staff session
// (`ews_session`) so a logged-in staff member and a logged-in intern can
// coexist in the same browser without collision. Same crypto pattern as
// src/lib/session.ts — kept symmetric on purpose for ease of audit.
//
// Cookie format: base64url(payload).base64url(signature)
// Payload:       JSON.stringify({ internId, email, exp })

import { cookies } from "next/headers";
import crypto from "node:crypto";

const COOKIE_NAME = "ews_intern_session";
// 7 days — interns log in often during the 8-week program; this strikes a
// balance between convenience (no daily re-login) and revocation latency
// (deactivation takes effect within a week even without an explicit logout).
// The guard ALSO re-checks Intern.status against the DB on every protected
// request, so deactivation is effectively immediate.
const SESSION_TTL_HOURS = 24 * 7;

export type InternSessionPayload = {
  internId: string;
  email: string;
  exp: number; // unix seconds
};

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 chars");
  }
  return s;
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf as never)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function sign(payload: string): string {
  // NOTE: intern signing uses a per-domain prefix so that a leaked staff
  // session token can't masquerade as an intern token (and vice versa).
  // Both still share the same SESSION_SECRET — we just include the role
  // in the HMAC input so the signature differs.
  return b64url(
    crypto.createHmac("sha256", secret()).update(`intern:${payload}`).digest()
  );
}

export function serializeInternSession(
  p: Omit<InternSessionPayload, "exp">
): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_HOURS * 3600;
  const json = JSON.stringify({ ...p, exp });
  const payload = b64url(json);
  return `${payload}.${sign(payload)}`;
}

export function verifyInternSession(token: string): InternSessionPayload | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  // Constant-time compare
  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return null;
  }
  try {
    const parsed = JSON.parse(
      b64urlDecode(payload).toString("utf8")
    ) as InternSessionPayload;
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ----- Cookie helpers (server-only) -----

export async function setInternSessionCookie(
  p: Omit<InternSessionPayload, "exp">
) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, serializeInternSession(p), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_HOURS * 3600,
  });
}

export async function clearInternSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getInternSession(): Promise<InternSessionPayload | null> {
  const jar = await cookies();
  const c = jar.get(COOKIE_NAME);
  if (!c) return null;
  return verifyInternSession(c.value);
}

export const INTERN_SESSION_COOKIE_NAME = COOKIE_NAME;
