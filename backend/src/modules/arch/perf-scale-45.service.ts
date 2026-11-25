/**
 * Architecture Service: Dynamic Memory Buffer Pool Recycler
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-45]
 */

export interface BufferPoolStats {
  tierSizes: number[];
  availableBuffers: number;
  totalAllocations: number;
  recycledHits: number;
}

export class DynamicBufferPoolRecyclerService {
  private pools: Map<number, Buffer[]>;
  private tierSizes: number[];
  private maxPerTier: number;
  private totalAllocations: number;
  private recycledHits: number;

  constructor(tierSizes: number[] = [1024, 16384, 65536], maxPerTier: number = 100) {
    this.tierSizes = [...tierSizes].sort((a, b) => a - b);
    this.maxPerTier = maxPerTier;
    this.pools = new Map();
    this.totalAllocations = 0;
    this.recycledHits = 0;

    for (const size of this.tierSizes) {
      this.pools.set(size, []);
    }
  }

  public acquire(minBytes: number): Buffer {
    this.totalAllocations++;
    const targetTier = this.tierSizes.find(size => size >= minBytes);

    if (!targetTier) {
      return Buffer.allocUnsafe(minBytes);
    }

    const tierList = this.pools.get(targetTier)!;
    if (tierList.length > 0) {
      this.recycledHits++;
      return tierList.pop()!;
    }

    return Buffer.allocUnsafe(targetTier);
  }

  public release(buf: Buffer): boolean {
    const size = buf.length;
    const tierList = this.pools.get(size);
    if (!tierList) {
      return false;
    }

    if (tierList.length < this.maxPerTier) {
      tierList.push(buf);
      return true;
    }
    return false;
  }

  public getStats(): BufferPoolStats {
    let availableBuffers = 0;
    for (const list of this.pools.values()) {
      availableBuffers += list.length;
    }

    return {
      tierSizes: this.tierSizes,
      availableBuffers,
      totalAllocations: this.totalAllocations,
      recycledHits: this.recycledHits
    };
  }

  public clear(): void {
    for (const list of this.pools.values()) {
      list.length = 0;
    }
  }
}
