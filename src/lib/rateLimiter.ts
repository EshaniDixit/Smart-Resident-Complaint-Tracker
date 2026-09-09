/**
 * Simple in-memory rate limiter.
 * Works for single-instance servers (dev + small VPS).
 * For serverless deployments at scale, swap this out for
 * an edge-safe store like Upstash Redis (@upstash/ratelimit).
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

/**
 * Returns true if the request is allowed, false if rate limit exceeded.
 * @param key       Unique identifier (e.g. IP address)
 * @param maxAttempts Max requests allowed per window
 * @param windowMs  Time window in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }

  if (record.count >= maxAttempts) {
    return false; // blocked
  }

  record.count++;
  return true; // allowed
}
