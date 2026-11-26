import { DnsCacheEntry } from '../../types/sre';

export class DnsResolutionCache {
  private cache: Map<string, DnsCacheEntry> = new Map();
  private defaultPositiveTtlMs: number;
  private defaultNegativeTtlMs: number;

  constructor(defaultPositiveTtlMs: number = 300000, defaultNegativeTtlMs: number = 30000) {
    this.defaultPositiveTtlMs = defaultPositiveTtlMs;
    this.defaultNegativeTtlMs = defaultNegativeTtlMs;
  }

  setPositive(hostname: string, address: string, customTtlMs?: number): void {
    const ttl = customTtlMs || this.defaultPositiveTtlMs;
    this.cache.set(hostname.toLowerCase(), {
      hostname: hostname.toLowerCase(),
      address,
      isNegative: false,
      expiresAt: Date.now() + ttl
    });
  }

  setNegative(hostname: string, customTtlMs?: number): void {
    const ttl = customTtlMs || this.defaultNegativeTtlMs;
    this.cache.set(hostname.toLowerCase(), {
      hostname: hostname.toLowerCase(),
      isNegative: true,
      expiresAt: Date.now() + ttl
    });
  }

  resolve(hostname: string): { hit: boolean; address?: string; isNegative?: boolean } {
    const entry = this.cache.get(hostname.toLowerCase());
    if (!entry) return { hit: false };

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(hostname.toLowerCase());
      return { hit: false };
    }

    return {
      hit: true,
      address: entry.address,
      isNegative: entry.isNegative
    };
  }
}
