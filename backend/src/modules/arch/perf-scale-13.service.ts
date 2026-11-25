/**
 * Architecture Service: Probabilistic X-Fetch Cache
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-13]
 */

export interface CacheEntry<T> {
  value: T;
  deltaMs: number;
  expiresAt: number;
}

export class ProbabilisticXFetchCacheService<T> {
  private cache: Map<string, CacheEntry<T>>;
  private beta: number;

  constructor(beta: number = 1.0) {
    this.cache = new Map();
    this.beta = beta;
  }

  public set(key: string, value: T, ttlMs: number, deltaMs: number = 50): void {
    this.cache.set(key, {
      value,
      deltaMs,
      expiresAt: Date.now() + ttlMs
    });
  }

  public shouldRecomputeEarly(entry: CacheEntry<T>, now: number = Date.now(), randomVal: number = 0.5): boolean {
    if (now >= entry.expiresAt) return true;
    const probabilityWindow = -this.beta * entry.deltaMs * Math.log(randomVal);
    return (now + probabilityWindow) >= entry.expiresAt;
  }

  public get(key: string, now: number = Date.now(), randomVal: number = 0.5): { value: T | null; needsRefresh: boolean } {
    const entry = this.cache.get(key);
    if (!entry) return { value: null, needsRefresh: true };

    const needsRefresh = this.shouldRecomputeEarly(entry, now, randomVal);
    return {
      value: entry.value,
      needsRefresh
    };
  }
}
