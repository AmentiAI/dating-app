/** In-memory limiter for POST /api/waitlist (best-effort per server instance). */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, number[]>();

export function allowWaitlistRequest(clientKey: string): boolean {
  const now = Date.now();
  const key = clientKey || "unknown";
  const windowStart = now - WINDOW_MS;
  const prev = hits.get(key) ?? [];
  const next = prev.filter((t) => t > windowStart);
  if (next.length >= MAX_PER_WINDOW) return false;
  next.push(now);
  hits.set(key, next);
  return true;
}
