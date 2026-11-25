/**
 * Architecture Service: Static Asset Cache Headers Governor
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-16]
 */

export interface CacheDirectives {
  cacheControl: string;
  etag?: string;
}

export class StaticAssetCacheControlService {
  public resolveDirectives(assetPath: string, contentHash?: string): CacheDirectives {
    const hasHashInName = /\.[a-f0-9]{8,64}\.(js|css|png|jpg|webp|svg)$/i.test(assetPath);

    if (hasHashInName) {
      return {
        cacheControl: 'public, max-age=31536000, immutable',
        etag: contentHash ? `"${contentHash}"` : undefined
      };
    }

    if (assetPath.endsWith('.html') || assetPath === '/' || assetPath.endsWith('.json')) {
      return {
        cacheControl: 'no-cache, no-store, must-revalidate',
        etag: contentHash ? `"${contentHash}"` : undefined
      };
    }

    return {
      cacheControl: 'public, max-age=86400',
      etag: contentHash ? `"${contentHash}"` : undefined
    };
  }
}
