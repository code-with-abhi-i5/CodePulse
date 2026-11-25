/**
 * Architecture Service: Frontend Performance Observer
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-37]
 */

export type MetricRating = 'good' | 'needs-improvement' | 'poor';

export interface WebVitalEntry {
  name: 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB';
  value: number;
  rating: MetricRating;
  timestamp: number;
}

export interface PerformanceTelemetryReport {
  vitals: Record<string, { value: number; rating: MetricRating }>;
  interactionPercentiles: { p75: number; p95: number; count: number };
  timestamp: number;
}

export class FrontendPerformanceObserverService {
  private vitals: Map<string, WebVitalEntry>;
  private interactionLatencies: number[];

  constructor() {
    this.vitals = new Map();
    this.interactionLatencies = [];
  }

  public classifyRating(name: string, value: number): MetricRating {
    switch (name) {
      case 'LCP':
        return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
      case 'INP':
        return value <= 200 ? 'good' : value <= 500 ? 'needs-improvement' : 'poor';
      case 'CLS':
        return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
      case 'FCP':
        return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
      case 'TTFB':
        return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
      default:
        return 'good';
    }
  }

  public recordMetric(name: 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB', value: number): WebVitalEntry {
    const rating = this.classifyRating(name, value);
    const entry: WebVitalEntry = {
      name,
      value,
      rating,
      timestamp: Date.now()
    };
    this.vitals.set(name, entry);
    return entry;
  }

  public recordInteraction(latencyMs: number): void {
    this.interactionLatencies.push(latencyMs);
    this.interactionLatencies.sort((a, b) => a - b);
    this.recordMetric('INP', latencyMs);
  }

  public getInteractionPercentiles(): { p75: number; p95: number; count: number } {
    const count = this.interactionLatencies.length;
    if (count === 0) {
      return { p75: 0, p95: 0, count: 0 };
    }
    const p75Index = Math.min(count - 1, Math.floor(count * 0.75));
    const p95Index = Math.min(count - 1, Math.floor(count * 0.95));
    return {
      p75: this.interactionLatencies[p75Index],
      p95: this.interactionLatencies[p95Index],
      count
    };
  }

  public generateReport(): PerformanceTelemetryReport {
    const vitalsRecord: Record<string, { value: number; rating: MetricRating }> = {};
    for (const [key, val] of this.vitals.entries()) {
      vitalsRecord[key] = { value: val.value, rating: val.rating };
    }
    return {
      vitals: vitalsRecord,
      interactionPercentiles: this.getInteractionPercentiles(),
      timestamp: Date.now()
    };
  }
}
