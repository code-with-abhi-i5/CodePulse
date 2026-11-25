/**
 * Architecture Service: Multi-Layer L1/L2 Caching Coordinator
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-03]
 */

export interface CacheEntry<T> {
  key: string;
  value: T;
  frequency: number;
  expiresAt: number;
}

export class MultiLayerCacheCoordinatorService<T> {
  private l1Cache: Map<string, CacheEntry<T>>;
  private l2Cache: Map<string, CacheEntry<T>>;
  private l1Capacity: number;

  constructor(l1Capacity: number = 3) {
    this.l1Cache = new Map();
    this.l2Cache = new Map();
    this.l1Capacity = l1Capacity;
  }

  public set(key: string, value: T, ttlMs: number = 60000): void {
    const expiresAt = Date.now() + ttlMs;
    const entry: CacheEntry<T> = { key, value, frequency: 1, expiresAt };

    if (this.l1Cache.size >= this.l1Capacity && !this.l1Cache.has(key)) {
      this.evictLfuL1();
    }

    this.l1Cache.set(key, entry);
    this.l2Cache.set(key, { ...entry });
  }

  public get(key: string, now: number = Date.now()): { value: T | null; source: 'L1' | 'L2' | 'MISS' } {
    // Check L1
    const l1 = this.l1Cache.get(key);
    if (l1 && now <= l1.expiresAt) {
      l1.frequency++;
      return { value: l1.value, source: 'L1' };
    }

    // Check L2
    const l2 = this.l2Cache.get(key);
    if (l2 && now <= l2.expiresAt) {
      l2.frequency++;
      // Promote to L1
      if (this.l1Cache.size >= this.l1Capacity) {
        this.evictLfuL1();
      }
      this.l1Cache.set(key, { ...l2 });
      return { value: l2.value, source: 'L2' };
    }

    return { value: null, source: 'MISS' };
  }

  public invalidate(key: string): void {
    this.l1Cache.delete(key);
    this.l2Cache.delete(key);
  }

  private evictLfuL1(): void {
    let minFreq = Infinity;
    let evictKey: string | null = null;
    for (const [k, entry] of this.l1Cache.entries()) {
      if (entry.frequency < minFreq) {
        minFreq = entry.frequency;
        evictKey = k;
      }
    }
    if (evictKey) {
      this.l1Cache.delete(evictKey);
    }
  }
}
