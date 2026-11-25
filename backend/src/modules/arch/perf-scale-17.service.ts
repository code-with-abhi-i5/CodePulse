/**
 * Architecture Service: High-Throughput JSON Stringifier
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-17]
 */

export interface TelemetryMetric {
  name: string;
  value: number;
  timestamp: number;
  status: string;
}

export class HighThroughputJsonStringifierService {
  public stringifyTelemetry(metric: TelemetryMetric): string {
    return `{"name":"${this.escapeString(metric.name)}","value":${metric.value},"timestamp":${metric.timestamp},"status":"${this.escapeString(metric.status)}"}`;
  }

  public stringifyTelemetryBatch(metrics: TelemetryMetric[]): string {
    const parts = metrics.map(m => this.stringifyTelemetry(m));
    return '[' + parts.join(',') + ']';
  }

  private escapeString(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }
}
