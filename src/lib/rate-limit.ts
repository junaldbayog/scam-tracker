/**
 * Sliding-window rate limiter, in-memory per server instance.
 * Fine for a single Node process; swap the store for Upstash Redis
 * (same interface) before scaling to multiple instances.
 */
const buckets = new Map<string, number[]>();

const MAX_KEYS = 50_000;

export function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): { ok: boolean; remaining: number } {
  // Escape hatch for local integration testing only — never set in production.
  if (process.env.RATE_LIMIT_DISABLED === "1") {
    return { ok: true, remaining: limit };
  }
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, remaining: 0 };
  }

  hits.push(now);
  if (buckets.size > MAX_KEYS) buckets.clear();
  buckets.set(key, hits);
  return { ok: true, remaining: limit - hits.length };
}

export const LIMITS = {
  vote: { limit: 10, windowSeconds: 3600 },
  comment: { limit: 3, windowSeconds: 3600 },
  report: { limit: 5, windowSeconds: 3600 },
  dispute: { limit: 2, windowSeconds: 3600 },
  search: { limit: 60, windowSeconds: 60 },
} as const;
