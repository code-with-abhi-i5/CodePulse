import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class DedupCacheService {
  private readonly cache: Map<string, number> = new Map();
  private duplicateDetections: number = 0;

  generateSignature(payload: string | Record<string, any>): string {
    const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHash('sha256').update(str).digest('hex').slice(0, 16);
  }

  isDuplicate(signature: string, ttlMs: number = 86400000): boolean {
    const now = Date.now();
    const exp = this.cache.get(signature);
    if (exp && exp > now) {
      this.duplicateDetections++;
      return true;
    }
    this.cache.set(signature, now + ttlMs);
    return false;
  }

  evictExpired(): number {
    const now = Date.now();
    let evicted = 0;
    for (const [sig, exp] of this.cache.entries()) {
      if (exp <= now) {
        this.cache.delete(sig);
        evicted++;
      }
    }
    return evicted;
  }

  getStats(): { totalEntries: number; duplicateDetections: number } {
    return {
      totalEntries: this.cache.size,
      duplicateDetections: this.duplicateDetections,
    };
  }
}
