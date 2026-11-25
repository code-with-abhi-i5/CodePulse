/**
 * Architecture Service: Dynamic Request Timeout Escalator
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-36]
 */

export interface UpstreamConfig {
  minTimeoutMs: number;
  maxTimeoutMs: number;
  bufferMultiplier: number;
  fallbackTimeoutMs: number;
}

export class DynamicTimeoutEscalatorService {
  private serviceLatencies: Map<string, number[]>;
  private config: UpstreamConfig;

  constructor(config?: Partial<UpstreamConfig>) {
    this.serviceLatencies = new Map();
    this.config = {
      minTimeoutMs: config?.minTimeoutMs ?? 50,
      maxTimeoutMs: config?.maxTimeoutMs ?? 5000,
      bufferMultiplier: config?.bufferMultiplier ?? 1.3,
      fallbackTimeoutMs: config?.fallbackTimeoutMs ?? 500
    };
  }

  public recordLatency(serviceName: string, latencyMs: number): void {
    let list = this.serviceLatencies.get(serviceName);
    if (!list) {
      list = [];
      this.serviceLatencies.set(serviceName, list);
    }
    list.push(latencyMs);
    if (list.length > 500) {
      list.shift();
    }
  }

  public getP99(serviceName: string): number | null {
    const list = this.serviceLatencies.get(serviceName);
    if (!list || list.length === 0) return null;

    const sorted = [...list].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.99));
    return sorted[idx];
  }

  public calculateTimeout(serviceName: string): number {
    const p99 = this.getP99(serviceName);
    if (p99 === null) {
      return this.config.fallbackTimeoutMs;
    }

    const calculated = Math.round(p99 * this.config.bufferMultiplier);
    return Math.min(this.config.maxTimeoutMs, Math.max(this.config.minTimeoutMs, calculated));
  }

  public reset(serviceName?: string): void {
    if (serviceName) {
      this.serviceLatencies.delete(serviceName);
    } else {
      this.serviceLatencies.clear();
    }
  }
}
