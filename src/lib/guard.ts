import type { NextRequest } from "next/server";

/**
 * Request guards shared by the API routes.
 *
 * Rate limits are kept in memory, per server instance. On Vercel that is a best-effort limit (each instance counts
 * on its own and resets when it sleeps); together with the per-request caps and the provider's own spending limit it
 * stops casual abuse. For a hard global limit, move `hits` to a shared store such as Upstash Redis.
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return true;
}

export function clientIp(req: NextRequest): string {
  return (req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}

/** Only this site's pages may call the API (a browser always sends Origin on a cross-site POST). */
export function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    const o = new URL(origin);
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
    return o.host === host || o.hostname === "localhost" || o.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

/** One line of plain text: no control characters, collapsed spaces, capped. */
export function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export const EMAIL = /^[^\s@<>"']{1,64}@[^\s@<>"']{1,189}\.[A-Za-z]{2,24}$/;
