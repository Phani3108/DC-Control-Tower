/**
 * In-process token bucket — protects outbound calls to third-party APIs
 * from runaway rate. Not durable; per-instance.
 *
 * Usage:
 *   const bucket = getBucket("ember", { maxTokens: 60, refillPerMinute: 60 });
 *   if (!bucket.take()) return cachedResponse;
 *   const fresh = await fetch(...);
 */

interface TokenBucketConfig {
  maxTokens: number;
  refillPerMinute: number;
}

class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRatePerMs: number;

  constructor(cfg: TokenBucketConfig) {
    this.maxTokens = cfg.maxTokens;
    this.tokens = cfg.maxTokens;
    this.refillRatePerMs = cfg.refillPerMinute / 60_000;
    this.lastRefill = Date.now();
  }

  take(count = 1): boolean {
    this.refill();
    if (this.tokens < count) return false;
    this.tokens -= count;
    return true;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRatePerMs);
    this.lastRefill = now;
  }
}

const buckets = new Map<string, TokenBucket>();

export function getBucket(key: string, cfg: TokenBucketConfig): TokenBucket {
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = new TokenBucket(cfg);
    buckets.set(key, bucket);
  }
  return bucket;
}
