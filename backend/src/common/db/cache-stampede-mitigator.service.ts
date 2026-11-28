import { XFetchResult } from '../../types/db';

export class CacheStampedeMitigatorService {
  constructor(private readonly beta: number = 1.0) {}

  public shouldRecomputeEarly(
    ttlRemainingMs: number,
    computationDeltaMs: number,
    randomValue: number = Math.random()
  ): boolean {
    if (ttlRemainingMs <= 0) {
      return true;
    }
    // X-Fetch formula: -beta * delta * ln(random) > expiry - now (which is ttlRemaining)
    // Avoid log(0)
    const rand = Math.max(randomValue, 1e-10);
    const threshold = -this.beta * computationDeltaMs * Math.log(rand);
    return threshold > ttlRemainingMs;
  }

  public evaluateCacheEntry<T>(
    cachedValue: T,
    expiryTimestamp: number,
    computationDeltaMs: number,
    now: number = Date.now(),
    randomValue: number = Math.random()
  ): XFetchResult<T> {
    const ttlRemainingMs = expiryTimestamp - now;
    const needsEarlyRecomputation = this.shouldRecomputeEarly(ttlRemainingMs, computationDeltaMs, randomValue);

    return {
      value: cachedValue,
      needsEarlyRecomputation,
      ttlRemainingMs: Math.max(0, ttlRemainingMs)
    };
  }
}
