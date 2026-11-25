import { Injectable } from '@nestjs/common';
import { XFetchCacheEntry } from '../../types/database';

@Injectable()
export class XFetchCacheService {
  private readonly store: Map<string, { value: any; expiresAt: number; computeTimeMs: number }> = new Map();

  shouldRecompute(deltaMs: number, beta: number, ttlRemainingMs: number): boolean {
    if (ttlRemainingMs <= 0) return true;
    const rand = Math.random();
    const threshold = -beta * deltaMs * Math.log(rand);
    return threshold >= ttlRemainingMs;
  }

  set(key: string, value: any, ttlMs: number, computeTimeMs: number = 50): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      computeTimeMs,
    });
  }

  get(key: string, beta: number = 1.0): XFetchCacheEntry | null {
    const item = this.store.get(key);
    if (!item) return null;

    const ttlRemaining = item.expiresAt - Date.now();
    const needsRecompute = this.shouldRecompute(item.computeTimeMs, beta, ttlRemaining);

    return {
      value: item.value,
      needsRecompute,
    };
  }
}
