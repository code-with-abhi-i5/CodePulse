/**
 * Architecture Service: CI Cache Coordinator
 * Subsystem: Advanced DevOps & Infrastructure Automation [DEVOPS-INFRA-15]
 */

export interface CacheEntry {
  cacheKey: string;
  sizeBytes: number;
  createdAt: number;
  hitCount: number;
}

export class CiCacheCoordinatorService {
  private cacheStore: Map<string, CacheEntry>;
  private maxCacheSizeBytes: number;

  constructor(maxCacheSizeBytes: number = 10737418240) {
    this.cacheStore = new Map();
    this.maxCacheSizeBytes = maxCacheSizeBytes;
  }

  public generateCacheKey(os: string, tool: string, lockfileHash: string): string {
    return 'cache-' + os + '-' + tool + '-' + lockfileHash;
  }

  public put(cacheKey: string, sizeBytes: number): boolean {
    if (sizeBytes > this.maxCacheSizeBytes) return false;

    this.cacheStore.set(cacheKey, {
      cacheKey,
      sizeBytes,
      createdAt: Date.now(),
      hitCount: 0
    });
    return true;
  }

  public get(cacheKey: string): CacheEntry | null {
    const entry = this.cacheStore.get(cacheKey);
    if (!entry) return null;
    entry.hitCount++;
    return entry;
  }

  public getTotalSize(): number {
    let sum = 0;
    for (const e of this.cacheStore.values()) sum += e.sizeBytes;
    return sum;
  }
}
