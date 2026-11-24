import { Injectable, Logger } from '@nestjs/common';
import { HighCardinalityIndexerService, MetricSample } from './high-cardinality-indexer.service';

export interface CompactedMetric {
  metricName: string;
  labels: Record<string, string>;
  count: number;
  sum: number;
}

@Injectable()
export class MetricCompactorService {
  private readonly logger = new Logger(MetricCompactorService.name);

  // Pre-aggregated metric buckets: key = "metricName{labels}"
  private readonly compactedBuckets = new Map<string, CompactedMetric>();

  constructor(private readonly indexer: HighCardinalityIndexerService) {}

  /**
   * Ingests a raw metric. If it contains high-cardinality labels, strips them for Prometheus
   * while indexing the full granularity into the local ring buffer.
   */
  public ingest(metricName: string, value: number, labels: Record<string, string>): void {
    if (this.indexer.hasHighCardinality(labels)) {
      this.indexer.recordGranular(metricName, value, labels);
    }

    // Strip high-entropy keys for Prometheus export
    const lowEntropyLabels: Record<string, string> = {};
    for (const [k, v] of Object.entries(labels)) {
      if (!HighCardinalityIndexerService.HIGH_ENTROPY_KEYS.has(k)) {
        lowEntropyLabels[k] = v;
      }
    }

    const bucketKey = this.generateBucketKey(metricName, lowEntropyLabels);
    let bucket = this.compactedBuckets.get(bucketKey);
    if (!bucket) {
      bucket = {
        metricName,
        labels: lowEntropyLabels,
        count: 0,
        sum: 0,
      };
      this.compactedBuckets.set(bucketKey, bucket);
    }

    bucket.count += 1;
    bucket.sum += value;
  }

  /**
   * Exports compacted Prometheus exposition text format.
   */
  public exportPrometheus(): string {
    const lines: string[] = [];

    for (const bucket of this.compactedBuckets.values()) {
      const labelPairs = Object.entries(bucket.labels)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}="${this.escapePrometheus(v)}"`)
        .join(',');

      const labelString = labelPairs ? `{${labelPairs}}` : '';
      lines.push(`${bucket.metricName}_count${labelString} ${bucket.count}`);
      lines.push(`${bucket.metricName}_sum${labelString} ${bucket.sum}`);
    }

    return lines.join('\n');
  }

  public getCompactedSeriesCount(): number {
    return this.compactedBuckets.size;
  }

  public clearBuckets(): void {
    this.compactedBuckets.clear();
  }

  private generateBucketKey(metricName: string, labels: Record<string, string>): string {
    const sorted = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${metricName}{${sorted}}`;
  }

  private escapePrometheus(val: string): string {
    return val.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }
}
