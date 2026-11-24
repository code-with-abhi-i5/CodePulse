import { Injectable, Logger, Optional } from '@nestjs/common';
import { RedisService } from '../../common/redis/redis.service';

export interface PreloadEntry<T = any> {
  key: string;
  data: T;
  ttlSeconds: number;
  warmedAt: number;
}

export interface PreloaderTelemetry {
  totalKeysWarmed: number;
  totalBytesWarmed: number;
  totalCacheHits: number;
  totalCacheMisses: number;
  hitRatioPercent: number;
}

@Injectable()
export class CachePreloaderService {
  private readonly logger = new Logger(CachePreloaderService.name);

  // In-memory fallback cache store
  private readonly localStore = new Map<string, PreloadEntry>();

  private totalWarmed = 0;
  private totalBytes = 0;
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(
    @Optional() private readonly redisService?: RedisService
  ) {}

  /**
   * Pre-warms an entity representation into cache with jittered TTL to avoid cache stampede.
   */
  public async preloadEntity<T>(
    cacheKey: string,
    data: T,
    baseTtlSeconds = 3600
  ): Promise<void> {
    const jitter = Math.floor(Math.random() * (baseTtlSeconds * 0.15));
    const effectiveTtl = baseTtlSeconds + jitter;
    const now = Date.now();

    const json = JSON.stringify(data);
    this.totalWarmed++;
    this.totalBytes += json.length;

    this.localStore.set(cacheKey, {
      key: cacheKey,
      data,
      ttlSeconds: effectiveTtl,
      warmedAt: now,
    });

    if (this.redisService) {
      try {
        await this.redisService.set(cacheKey, json, effectiveTtl);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Redis preloading write failed for ${cacheKey}, using local store: ${errorMsg}`);
      }
    }

    this.logger.debug(`Pre-warmed cache key '${cacheKey}' (TTL: ${effectiveTtl}s, size: ${json.length} bytes)`);
  }

  /**
   * Reads a pre-warmed entity from cache (Redis or local store).
   */
  public async get<T>(cacheKey: string): Promise<T | null> {
    const now = Date.now();

    if (this.redisService) {
      try {
        const redisVal = await this.redisService.get(cacheKey);
        if (redisVal) {
          this.cacheHits++;
          return JSON.parse(redisVal) as T;
        }
      } catch {
        // Fallback to local store
      }
    }

    const local = this.localStore.get(cacheKey);
    if (local) {
      const ageSeconds = (now - local.warmedAt) / 1000;
      if (ageSeconds < local.ttlSeconds) {
        this.cacheHits++;
        return local.data as T;
      }
      this.localStore.delete(cacheKey);
    }

    this.cacheMisses++;
    return null;
  }

  public invalidate(cacheKey: string): void {
    this.localStore.delete(cacheKey);
    if (this.redisService) {
      void this.redisService.del(cacheKey).catch(() => {});
    }
  }

  public getTelemetry(): PreloaderTelemetry {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRatio = totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 100;

    return {
      totalKeysWarmed: this.totalWarmed,
      totalBytesWarmed: this.totalBytes,
      totalCacheHits: this.cacheHits,
      totalCacheMisses: this.cacheMisses,
      hitRatioPercent: Math.round(hitRatio * 100) / 100,
    };
  }

  public clear(): void {
    this.localStore.clear();
    this.totalWarmed = 0;
    this.totalBytes = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}
