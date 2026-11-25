import { Injectable } from '@nestjs/common';
import { WorkerAutoscalerMetrics } from '../../types/queues';

@Injectable()
export class WorkerAutoscalerService {
  private readonly latencies: Map<string, number[]> = new Map();
  private readonly minConcurrency: number = 2;
  private readonly maxConcurrency: number = 50;

  recordMetric(queue: string, latencyMs: number): void {
    if (!this.latencies.has(queue)) {
      this.latencies.set(queue, []);
    }
    const list = this.latencies.get(queue)!;
    list.push(latencyMs);
    if (list.length > 1000) {
      list.shift();
    }
  }

  getPercentiles(queue: string): WorkerAutoscalerMetrics {
    const list = this.latencies.get(queue);
    if (!list || list.length === 0) {
      return { p50: 0, p95: 0, p99: 0 };
    }
    const sorted = [...list].sort((a, b) => a - b);
    return {
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  calculateTargetConcurrency(currentConcurrency: number, p95LatencyMs: number, queueDepth: number): number {
    let target = currentConcurrency;
    if (p95LatencyMs > 2000 || queueDepth > 500) {
      target = Math.min(this.maxConcurrency, Math.ceil(currentConcurrency * 1.5));
    } else if (p95LatencyMs < 300 && queueDepth < 10) {
      target = Math.max(this.minConcurrency, Math.floor(currentConcurrency * 0.8));
    }
    return target;
  }
}
