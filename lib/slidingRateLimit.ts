/** In-memory sliding window (per server instance). */
const buckets = new Map<string, number[]>();

export function slidingWindowAllow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const k = key || "unknown";
  const start = now - windowMs;
  const prev = buckets.get(k) ?? [];
  const next = prev.filter((t) => t > start);
  if (next.length >= max) return false;
  next.push(now);
  buckets.set(k, next);
  return true;
}
