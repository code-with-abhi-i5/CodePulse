/**
 * Architecture Service: High-Concurrency Token Bucket Rate Limiter
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-27]
 */

export class HighConcurrencyTokenBucketService {
  private capacity: number;
  private refillRateTokensPerSec: number;
  private tokens: number;
  private lastRefillTimestamp: number;

  constructor(capacity: number = 10, refillRateTokensPerSec: number = 2) {
    this.capacity = capacity;
    this.refillRateTokensPerSec = refillRateTokensPerSec;
    this.tokens = capacity;
    this.lastRefillTimestamp = Date.now();
  }

  public tryConsume(tokensRequested: number = 1, now: number = Date.now()): { allowed: boolean; remainingTokens: number; waitTimeMs: number } {
    this.refill(now);

    if (this.tokens >= tokensRequested) {
      this.tokens -= tokensRequested;
      return { allowed: true, remainingTokens: Math.floor(this.tokens), waitTimeMs: 0 };
    }

    const missingTokens = tokensRequested - this.tokens;
    const waitTimeMs = Math.ceil((missingTokens / this.refillRateTokensPerSec) * 1000);
    return { allowed: false, remainingTokens: Math.floor(this.tokens), waitTimeMs };
  }

  private refill(now: number): void {
    const elapsedSec = Math.max(0, (now - this.lastRefillTimestamp) / 1000);
    this.tokens = Math.min(this.capacity, this.tokens + elapsedSec * this.refillRateTokensPerSec);
    this.lastRefillTimestamp = now;
  }
}
