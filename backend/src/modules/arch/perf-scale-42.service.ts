/**
 * Architecture Service: Sharded Atomic Counter
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-42]
 */

export class ShardedAtomicCounterService {
  private shardsCount: number;
  private shards: Map<string, number[]>;

  constructor(shardsCount: number = 16) {
    this.shardsCount = shardsCount;
    this.shards = new Map();
  }

  private hashIndex(workerId: string | number): number {
    let hash = 0;
    const str = String(workerId);
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % this.shardsCount;
  }

  public increment(counterKey: string, delta: number = 1, workerId?: string | number): void {
    let slots = this.shards.get(counterKey);
    if (!slots) {
      slots = new Array(this.shardsCount).fill(0);
      this.shards.set(counterKey, slots);
    }

    const idx = workerId !== undefined 
      ? this.hashIndex(workerId)
      : Math.floor(Math.random() * this.shardsCount);

    slots[idx] += delta;
  }

  public get(counterKey: string): number {
    const slots = this.shards.get(counterKey);
    if (!slots) return 0;
    return slots.reduce((acc, val) => acc + val, 0);
  }

  public getShardDistribution(counterKey: string): number[] {
    const slots = this.shards.get(counterKey);
    return slots ? [...slots] : new Array(this.shardsCount).fill(0);
  }

  public reset(counterKey?: string): void {
    if (counterKey) {
      this.shards.delete(counterKey);
    } else {
      this.shards.clear();
    }
  }
}
