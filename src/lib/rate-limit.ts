// Tiny in-memory sliding-window rate limiter.
//
// Why not Redis: this is a one-day drive. The fleet of Vercel function
// instances is small (peak ~10) and short-lived. A per-instance limit at
// 30 req/min still cuts an attacker's effective throughput by ~10x while
// avoiding the operational cost of Upstash/Redis for a one-shot event.
//
// Each key (typically "<action>:<ip>") gets a circular buffer of recent
// hit timestamps. Hits older than the window are evicted on every check.

import { headers } from "next/headers";

type Bucket = { hits: number[]; banUntil: number };
const buckets = new Map<string, Bucket>();

// Periodic GC so the Map doesn't grow forever under sustained traffic.
let lastGc = Date.now();
function maybeGc(now: number) {
  if (now - lastGc < 60_000) return;
  lastGc = now;
  for (const [k, b] of buckets) {
    const fresh = b.hits.filter((t) => now - t < 600_000);
    if (fresh.length === 0 && b.banUntil <= now) buckets.delete(k);
    else b.hits = fresh;
  }
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  banMs: number = 0
): RateLimitResult {
  const now = Date.now();
  maybeGc(now);
  const b = buckets.get(key) ?? { hits: [], banUntil: 0 };

  if (b.banUntil > now) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((b.banUntil - now) / 1000),
    };
  }

  // Drop hits older than the window.
  b.hits = b.hits.filter((t) => now - t < windowMs);

  if (b.hits.length >= limit) {
    if (banMs > 0) b.banUntil = now + banMs;
    buckets.set(key, b);
    const retryMs = banMs > 0 ? banMs : windowMs - (now - b.hits[0]);
    return { ok: false, retryAfterSec: Math.ceil(retryMs / 1000) };
  }

  b.hits.push(now);
  buckets.set(key, b);
  return { ok: true };
}

/**
 * Get a stable client identifier from request headers. Prefers the
 * x-forwarded-for chain Vercel sets, falls back to the remote address
 * header, finally a fixed bucket if neither is present.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) {
    // First entry is the original client; rest are proxies.
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip") || h.get("cf-connecting-ip") || "unknown";
}
