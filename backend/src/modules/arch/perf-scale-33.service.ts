/**
 * Architecture Service: Circular Metrics Buffer
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-33]
 */

export interface MetricSample {
  timestamp: number;
  value: number;
  name: string;
}

export interface MetricSummary {
  count: number;
  min: number;
  max: number;
  mean: number;
  p95: number;
}

export class CircularMetricsBufferService {
  private buffer: (MetricSample | null)[];
  private capacity: number;
  private writePointer: number;
  private totalWrites: number;

  constructor(capacity: number = 1000) {
    this.capacity = capacity;
    this.buffer = new Array(capacity).fill(null);
    this.writePointer = 0;
    this.totalWrites = 0;
  }

  public record(name: string, value: number, timestamp: number = Date.now()): void {
    const idx = this.writePointer % this.capacity;
    this.buffer[idx] = { name, value, timestamp };
    this.writePointer = (this.writePointer + 1) % this.capacity;
    this.totalWrites++;
  }

  public getRecent(count?: number): MetricSample[] {
    const available = Math.min(this.totalWrites, this.capacity);
    const take = count !== undefined ? Math.min(count, available) : available;
    const result: MetricSample[] = [];

    let curr = (this.writePointer - 1 + this.capacity) % this.capacity;
    for (let i = 0; i < take; i++) {
      const item = this.buffer[curr];
      if (item) {
        result.push(item);
      }
      curr = (curr - 1 + this.capacity) % this.capacity;
    }
    return result;
  }

  public getSummary(metricName?: string): MetricSummary {
    const samples = this.getRecent();
    const filtered = metricName ? samples.filter(s => s.name === metricName) : samples;

    if (filtered.length === 0) {
      return { count: 0, min: 0, max: 0, mean: 0, p95: 0 };
    }

    const values = filtered.map(s => s.value).sort((a, b) => a - b);
    const count = values.length;
    const min = values[0];
    const max = values[count - 1];
    const sum = values.reduce((acc, v) => acc + v, 0);
    const mean = sum / count;
    const p95Idx = Math.min(count - 1, Math.floor(count * 0.95));
    const p95 = values[p95Idx];

    return { count, min, max, mean, p95 };
  }

  public getCapacity(): number {
    return this.capacity;
  }

  public getTotalWrites(): number {
    return this.totalWrites;
  }

  public clear(): void {
    this.buffer.fill(null);
    this.writePointer = 0;
    this.totalWrites = 0;
  }
}
