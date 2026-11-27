export interface PageCacheStats {
  hits: number;
  misses: number;
  a1inSize: number;
  a1outSize: number;
  amSize: number;
}

export class BTree2QPageCacheManager<T = any> {
  private kin: number; // Max size of A1in
  private kout: number; // Max size of A1out (ghost cache)
  private maxAm: number; // Max size of Am (frequent LRU)
  
  private a1in = new Map<string, T>(); // FIFO queue
  private a1out = new Set<string>(); // Ghost cache: keys only
  private am = new Map<string, T>(); // LRU cache
  private stats: PageCacheStats = { hits: 0, misses: 0, a1inSize: 0, a1outSize: 0, amSize: 0 };

  constructor(totalCapacity = 100) {
    this.kin = Math.max(1, Math.floor(totalCapacity * 0.25));
    this.kout = Math.max(1, Math.floor(totalCapacity * 0.50));
    this.maxAm = Math.max(1, totalCapacity - this.kin);
  }

  public get(key: string): T | undefined {
    // 1. Check Am (hot pages)
    if (this.am.has(key)) {
      this.stats.hits++;
      const val = this.am.get(key)!;
      // Re-insert to mark most recently used
      this.am.delete(key);
      this.am.set(key, val);
      return val;
    }

    // 2. Check A1in
    if (this.a1in.has(key)) {
      this.stats.hits++;
      return this.a1in.get(key);
    }

    this.stats.misses++;
    return undefined;
  }

  public put(key: string, value: T): void {
    // If in Am: update and move to MRU
    if (this.am.has(key)) {
      this.am.delete(key);
      this.am.set(key, value);
      return;
    }

    // If in A1out (ghost hit: proven recurrent page!) -> Promote to Am
    if (this.a1out.has(key)) {
      this.a1out.delete(key);
      if (this.am.size >= this.maxAm) {
        // Evict LRU from Am (first key in map)
        const oldest = this.am.keys().next().value;
        if (oldest) this.am.delete(oldest);
      }
      this.am.set(key, value);
      this.updateStats();
      return;
    }

    // If already in A1in: update value
    if (this.a1in.has(key)) {
      this.a1in.set(key, value);
      return;
    }

    // Fresh page: insert into A1in
    if (this.a1in.size >= this.kin) {
      // Evict oldest from A1in to A1out
      const oldest = this.a1in.keys().next().value;
      if (oldest) {
        this.a1in.delete(oldest);
        if (this.a1out.size >= this.kout) {
          const oldestGhost = this.a1out.values().next().value;
          if (oldestGhost) this.a1out.delete(oldestGhost);
        }
        this.a1out.add(oldest);
      }
    }

    this.a1in.set(key, value);
    this.updateStats();
  }

  private updateStats(): void {
    this.stats.a1inSize = this.a1in.size;
    this.stats.a1outSize = this.a1out.size;
    this.stats.amSize = this.am.size;
  }

  public getStats(): PageCacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  public clear(): void {
    this.a1in.clear();
    this.a1out.clear();
    this.am.clear();
    this.updateStats();
  }
}
