// HMAC-signed session cookie. No external deps. Works in mock + supabase auth modes.
// Cookie format: base64url(payload).base64url(signature)
// Payload: JSON.stringify({ userId, role, email, exp })

import { cookies } from "next/headers";
import crypto from "node:crypto";
import type { UserRole } from "@/generated/prisma/enums";

const COOKIE_NAME = "ews_session";
const SESSION_TTL_HOURS = 12;

export type SessionPayload = {
  userId: string;
  email: string;
  role: UserRole;
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
  return b64url(
    crypto.createHmac("sha256", secret()).update(payload).digest()
  );
}

export function serializeSession(p: Omit<SessionPayload, "exp">): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_HOURS * 3600;
  const json = JSON.stringify({ ...p, exp });
  const payload = b64url(json);
  return `${payload}.${sign(payload)}`;
}

export function verifySession(token: string): SessionPayload | null {
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
    const parsed = JSON.parse(b64urlDecode(payload).toString("utf8")) as SessionPayload;
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ----- Cookie helpers (server-only) -----

export async function setSessionCookie(p: Omit<SessionPayload, "exp">) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, serializeSession(p), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_HOURS * 3600,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const c = jar.get(COOKIE_NAME);
  if (!c) return null;
  return verifySession(c.value);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
