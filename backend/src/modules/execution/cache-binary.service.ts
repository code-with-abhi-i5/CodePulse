import { Injectable, Logger } from '@nestjs/common';
import crypto from 'node:crypto';

export interface BinaryEntry {
  hash: string;
  binarySize: number;
  createdAt: number;
  lastAccessedAt: number;
  hits: number;
}

@Injectable()
export class CacheBinaryService {
  private readonly logger = new Logger(CacheBinaryService.name);
  private cache: Map<string, { data: Buffer; meta: BinaryEntry }> = new Map();

  public computeSourceHash(code: string, compilerFlags: string[] = []): string {
    const payload = `${code.trim()}::${compilerFlags.sort().join(' ')}`;
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  public getCachedBinary(hash: string): Buffer | null {
    const item = this.cache.get(hash);
    if (!item) return null;
    item.meta.hits++;
    item.meta.lastAccessedAt = Date.now();
    return item.data;
  }

  public storeCompiledBinary(hash: string, binary: Buffer): boolean {
    this.cache.set(hash, {
      data: binary,
      meta: {
        hash,
        binarySize: binary.length,
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        hits: 0
      }
    });
    return true;
  }

  public evictLruBinaries(targetBytesToFree: number): number {
    let freed = 0;
    const sorted = Array.from(this.cache.entries()).sort((a, b) => a[1].meta.lastAccessedAt - b[1].meta.lastAccessedAt);
    for (const [hash, item] of sorted) {
      if (freed >= targetBytesToFree) break;
      freed += item.meta.binarySize;
      this.cache.delete(hash);
    }
    return freed;
  }

  public getCacheStats() {
    return {
      entriesCount: this.cache.size,
      totalBytes: Array.from(this.cache.values()).reduce((sum, item) => sum + item.meta.binarySize, 0)
    };
  }
}
