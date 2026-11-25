/**
 * Architecture Service: Sandbox Startup Accelerator
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-29]
 */

export interface WarmSandbox {
  id: string;
  runtime: string;
  readyAt: number;
}

export class SandboxStartupAcceleratorService {
  private warmPool: Map<string, WarmSandbox[]>;
  private maxPerRuntime: number;

  constructor(maxPerRuntime: number = 5) {
    this.warmPool = new Map();
    this.maxPerRuntime = maxPerRuntime;
  }

  public prewarm(runtime: string, count: number = 1): void {
    if (!this.warmPool.has(runtime)) {
      this.warmPool.set(runtime, []);
    }
    const pool = this.warmPool.get(runtime)!;
    for (let i = 0; i < count; i++) {
      if (pool.length < this.maxPerRuntime) {
        pool.push({
          id: `sbx_${runtime}_${Math.random().toString(36).substring(2, 6)}`,
          runtime,
          readyAt: Date.now()
        });
      }
    }
  }

  public acquireSandbox(runtime: string): { sandbox: WarmSandbox; isWarm: boolean } {
    const pool = this.warmPool.get(runtime) || [];
    if (pool.length > 0) {
      const sandbox = pool.pop()!;
      // Automatically replenish in background
      setTimeout(() => this.prewarm(runtime, 1), 0);
      return { sandbox, isWarm: true };
    }

    // Cold start
    const coldSandbox: WarmSandbox = {
      id: `sbx_${runtime}_cold_${Date.now()}`,
      runtime,
      readyAt: Date.now()
    };
    return { sandbox: coldSandbox, isWarm: false };
  }

  public getWarmCount(runtime: string): number {
    return (this.warmPool.get(runtime) || []).length;
  }
}
