import 'server-only';

type Bucket = {
  count: number;
  resetAt: number;
};

declare global {
  var __pulsoRateLimitBuckets: Map<string, Bucket> | undefined;
}

const buckets = globalThis.__pulsoRateLimitBuckets ?? new Map<string, Bucket>();
globalThis.__pulsoRateLimitBuckets = buckets;

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  current.count += 1;
  return {
    allowed: true,
    remaining: limit - current.count,
    retryAfter: Math.ceil((current.resetAt - now) / 1000),
  };
}
