/**
 * Architecture Service: API Telemetry & Percentile Aggregator
 * Subsystem: API Gateway Observability & Latency Metrics
 */

export interface RequestMetric {
  path: string;
  durationMs: number;
  reqBytes: number;
  resBytes: number;
}

export class ApiTelemetryPercentileService {
  private readonly samples: number[] = [];

  public recordSample(metric: RequestMetric): void {
    this.samples.push(metric.durationMs);
    if (this.samples.length > 1000) {
      this.samples.shift(); // Keep rolling window
    }
  }

  public getPercentile(p: number): number {
    if (this.samples.length === 0) return 0;
    const sorted = [...this.samples].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }
}
