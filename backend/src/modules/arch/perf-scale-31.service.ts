/**
 * Architecture Service: String Intern Pool
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-31]
 */

export interface InternStats {
  poolSize: number;
  totalInternedRequests: number;
  dedupedHits: number;
  estimatedMemorySavedBytes: number;
}

export class StringInternPoolService {
  private pool: Map<string, string>;
  private totalRequests: number;
  private dedupedHits: number;
  private savedBytes: number;

  constructor() {
    this.pool = new Map();
    this.totalRequests = 0;
    this.dedupedHits = 0;
    this.savedBytes = 0;
  }

  public intern(val: string): string {
    this.totalRequests++;
    if (!val || typeof val !== 'string') {
      return val;
    }

    const existing = this.pool.get(val);
    if (existing !== undefined) {
      this.dedupedHits++;
      this.savedBytes += val.length * 2;
      return existing;
    }

    this.pool.set(val, val);
    return val;
  }

  public internArray(vals: string[]): string[] {
    if (!Array.isArray(vals)) return [];
    return vals.map(v => this.intern(v));
  }

  public has(val: string): boolean {
    return this.pool.has(val);
  }

  public getPoolSize(): number {
    return this.pool.size;
  }

  public getStats(): InternStats {
    return {
      poolSize: this.pool.size,
      totalInternedRequests: this.totalRequests,
      dedupedHits: this.dedupedHits,
      estimatedMemorySavedBytes: this.savedBytes
    };
  }

  public clear(): void {
    this.pool.clear();
    this.totalRequests = 0;
    this.dedupedHits = 0;
    this.savedBytes = 0;
  }
}
