/**
 * Architecture Service: DNS Lookup Cache and Connection Pooling Agent
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-21]
 */

export interface DnsCacheEntry {
  hostname: string;
  ip: string;
  expiresAt: number;
  isNegative: boolean;
}

export class DnsLookupCacheAgentService {
  private cache: Map<string, DnsCacheEntry>;
  private defaultTtlMs: number;
  private negativeTtlMs: number;
  private hits: number;
  private misses: number;

  constructor(defaultTtlMs: number = 60000, negativeTtlMs: number = 5000) {
    this.cache = new Map();
    this.defaultTtlMs = defaultTtlMs;
    this.negativeTtlMs = negativeTtlMs;
    this.hits = 0;
    this.misses = 0;
  }

  public setResolution(hostname: string, ip: string, ttlMs: number = this.defaultTtlMs): void {
    this.cache.set(hostname.toLowerCase(), {
      hostname: hostname.toLowerCase(),
      ip,
      expiresAt: Date.now() + ttlMs,
      isNegative: false
    });
  }

  public setNegativeResolution(hostname: string): void {
    this.cache.set(hostname.toLowerCase(), {
      hostname: hostname.toLowerCase(),
      ip: '',
      expiresAt: Date.now() + this.negativeTtlMs,
      isNegative: true
    });
  }

  public resolve(hostname: string, now: number = Date.now()): { ip: string | null; fromCache: boolean; isNegative: boolean } {
    const key = hostname.toLowerCase();
    const entry = this.cache.get(key);

    if (entry && now <= entry.expiresAt) {
      this.hits++;
      return {
        ip: entry.isNegative ? null : entry.ip,
        fromCache: true,
        isNegative: entry.isNegative
      };
    }

    this.misses++;
    return { ip: null, fromCache: false, isNegative: false };
  }

  public getStats(): { hits: number; misses: number; cachedEntries: number } {
    return {
      hits: this.hits,
      misses: this.misses,
      cachedEntries: this.cache.size
    };
  }
}
