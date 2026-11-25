/**
 * Architecture Service: Scalable Redis Hash Sliding Window Rate Limiter
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-40]
 */

export interface RateLimitDecision {
  allowed: boolean;
  totalInWindow: number;
  limit: number;
  remaining: number;
  resetMs: number;
}

export class RedisHashSlidingWindowRateLimiterService {
  private buckets: Map<string, Map<number, number>>;
  private limit: number;
  private windowSec: number;

  constructor(limit: number = 60, windowSec: number = 60) {
    this.buckets = new Map();
    this.limit = limit;
    this.windowSec = windowSec;
  }

  public recordRequest(clientId: string, nowMs: number = Date.now()): RateLimitDecision {
    const currentSec = Math.floor(nowMs / 1000);
    const windowStartSec = currentSec - this.windowSec + 1;

    let clientMap = this.buckets.get(clientId);
    if (!clientMap) {
      clientMap = new Map();
      this.buckets.set(clientId, clientMap);
    }

    for (const sec of clientMap.keys()) {
      if (sec < windowStartSec) {
        clientMap.delete(sec);
      }
    }

    let currentTotal = 0;
    for (const count of clientMap.values()) {
      currentTotal += count;
    }

    if (currentTotal >= this.limit) {
      return {
        allowed: false,
        totalInWindow: currentTotal,
        limit: this.limit,
        remaining: 0,
        resetMs: (windowStartSec + this.windowSec) * 1000 - nowMs
      };
    }

    const currentCount = clientMap.get(currentSec) || 0;
    clientMap.set(currentSec, currentCount + 1);
    currentTotal++;

    return {
      allowed: true,
      totalInWindow: currentTotal,
      limit: this.limit,
      remaining: this.limit - currentTotal,
      resetMs: (windowStartSec + this.windowSec) * 1000 - nowMs
    };
  }

  public clear(clientId?: string): void {
    if (clientId) {
      this.buckets.delete(clientId);
    } else {
      this.buckets.clear();
    }
  }
}
