import { Injectable, Logger } from '@nestjs/common';

export interface MetricSample {
  metricName: string;
  value: number;
  timestamp: number;
  labels: Record<string, string>;
}

@Injectable()
export class HighCardinalityIndexerService {
  private readonly logger = new Logger(HighCardinalityIndexerService.name);

  // High entropy keys that cause explosion in Prometheus time-series
  public static readonly HIGH_ENTROPY_KEYS = new Set([
    'user_id',
    'userId',
    'session_id',
    'sessionId',
    'challenge_id',
    'challengeId',
    'ip',
    'client_ip',
    'trace_id',
    'traceId',
  ]);

  // Local short-lived ring buffer for detailed entity queries
  private readonly granularBuffer: MetricSample[] = [];
  private readonly MAX_LOCAL_BUFFER_SIZE = 10000;
  private readonly RETENTION_MS = 10 * 60 * 1000; // 10 minutes

  /**
   * Records a granular metric sample into the local buffer.
   */
  public recordGranular(metricName: string, value: number, labels: Record<string, string>): void {
    const sample: MetricSample = {
      metricName,
      value,
      timestamp: Date.now(),
      labels: { ...labels },
    };

    this.granularBuffer.push(sample);
    if (this.granularBuffer.length > this.MAX_LOCAL_BUFFER_SIZE) {
      this.granularBuffer.shift();
    }
  }

  /**
   * Queries granular telemetry for a specific high-cardinality entity (e.g. user_id).
   */
  public queryEntityMetrics(labelKey: string, labelValue: string): MetricSample[] {
    const cutoff = Date.now() - this.RETENTION_MS;
    return this.granularBuffer.filter(
      (s) => s.timestamp >= cutoff && s.labels[labelKey] === labelValue,
    );
  }

  /**
   * Identifies whether a given label set contains high-cardinality dimensions.
   */
  public hasHighCardinality(labels: Record<string, string>): boolean {
    for (const key of Object.keys(labels)) {
      if (HighCardinalityIndexerService.HIGH_ENTROPY_KEYS.has(key)) {
        return true;
      }
    }
    return false;
  }

  public getBufferSize(): number {
    return this.granularBuffer.length;
  }
}
