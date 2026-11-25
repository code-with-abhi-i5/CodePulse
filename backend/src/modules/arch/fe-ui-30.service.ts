/**
 * Architecture Service: PWA Offline Cache Manager
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-30]
 */

export class PwaOfflineCacheManagerService {
  private cacheStore: Map<string, { body: string; cachedAt: number }>;
  private maxAgeMs: number;

  constructor(maxAgeMs: number = 86400000) { // 24 hours
    this.maxAgeMs = maxAgeMs;
    this.cacheStore = new Map();
  }

  public cacheResponse(url: string, body: string): void {
    this.cacheStore.set(url, { body, cachedAt: Date.now() });
  }

  public getCachedResponse(url: string): string | null {
    const entry = this.cacheStore.get(url);
    if (!entry) return null;
    if (Date.now() - entry.cachedAt > this.maxAgeMs) {
      this.cacheStore.delete(url);
      return null;
    }
    return entry.body;
  }

  public resolveFetchStrategy(url: string, isOnline: boolean, networkFetch: () => string): { source: 'NETWORK' | 'CACHE'; body: string } {
    if (isOnline) {
      try {
        const body = networkFetch();
        this.cacheResponse(url, body);
        return { source: 'NETWORK', body };
      } catch (err) {
        // Fallback to cache if network fetch throws
        const cached = this.getCachedResponse(url);
        if (cached) return { source: 'CACHE', body: cached };
        throw err;
      }
    }

    const cached = this.getCachedResponse(url);
    if (cached) return { source: 'CACHE', body: cached };
    throw new Error('Offline and asset not cached');
  }
}
