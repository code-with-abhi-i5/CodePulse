import { Injectable, Logger } from '@nestjs/common';

export interface HeapSample {
  timestamp: number; // Unix ms
  heapUsedBytes: number;
  heapTotalBytes: number;
  externalBytes: number;
  rssBytes: number;
}

export interface LeakTrendAnalysis {
  isLeakSuspected: boolean;
  slopeBytesPerMinute: number;
  rSquaredScore: number;
  sustainedGrowthMinutes: number;
  projectedOomMinutes: number | null;
  sampleCount: number;
  currentHeapUsedMb: number;
}

@Injectable()
export class MemoryLeakDetectorService {
  private readonly logger = new Logger(MemoryLeakDetectorService.name);

  // Maximum sampling window: 30 minutes of history
  private readonly samples: HeapSample[] = [];
  public readonly minSamplesForAnalysis = 6;
  public readonly oomThresholdBytes = 1024 * 1024 * 1024 * 1.5; // 1.5GB typical container memory limit

  // Thresholds: sustained slope > 1.5MB/min, R^2 > 0.85 (highly linear monotonic growth)
  public readonly leakSlopeThresholdBytesPerMin = 1.5 * 1024 * 1024;
  public readonly minRSquared = 0.85;

  /**
   * Records a snapshot of process memory metrics.
   */
  public recordSample(sample?: Partial<HeapSample>, now = Date.now()): LeakTrendAnalysis {
    let heapUsed = 0;
    let heapTotal = 0;
    let external = 0;
    let rss = 0;

    if (typeof process !== 'undefined' && process.memoryUsage) {
      const mem = process.memoryUsage();
      heapUsed = mem.heapUsed;
      heapTotal = mem.heapTotal;
      external = mem.external;
      rss = mem.rss;
    }

    const newSample: HeapSample = {
      timestamp: sample?.timestamp ?? now,
      heapUsedBytes: sample?.heapUsedBytes ?? heapUsed,
      heapTotalBytes: sample?.heapTotalBytes ?? heapTotal,
      externalBytes: sample?.externalBytes ?? external,
      rssBytes: sample?.rssBytes ?? rss,
    };

    this.samples.push(newSample);

    // Retain only samples within 35 minutes
    const cutoff = now - 35 * 60 * 1000;
    while (this.samples.length > 0 && this.samples[0].timestamp < cutoff) {
      this.samples.shift();
    }

    return this.analyzeTrend(now);
  }

  /**
   * Performs ordinary least squares linear regression over the sampling window.
   */
  public analyzeTrend(now = Date.now()): LeakTrendAnalysis {
    if (this.samples.length < this.minSamplesForAnalysis) {
      const current = this.samples[this.samples.length - 1]?.heapUsedBytes ?? 0;
      return {
        isLeakSuspected: false,
        slopeBytesPerMinute: 0,
        rSquaredScore: 0,
        sustainedGrowthMinutes: 0,
        projectedOomMinutes: null,
        sampleCount: this.samples.length,
        currentHeapUsedMb: Math.round((current / (1024 * 1024)) * 100) / 100,
      };
    }

    const n = this.samples.length;
    const t0 = this.samples[0].timestamp;

    // Convert time to minutes relative to t0
    const x = this.samples.map((s) => (s.timestamp - t0) / 60000);
    const y = this.samples.map((s) => s.heapUsedBytes);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const meanX = sumX / n;
    const meanY = sumY / n;

    let numerator = 0;
    let denominatorX = 0;
    let totalVariationY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      denominatorX += dx * dx;
      totalVariationY += dy * dy;
    }

    const slope = denominatorX === 0 ? 0 : numerator / denominatorX; // bytes per minute

    // Calculate R-squared (coefficient of determination)
    let residualSumSquares = 0;
    const intercept = meanY - slope * meanX;

    for (let i = 0; i < n; i++) {
      const predicted = slope * x[i] + intercept;
      const res = y[i] - predicted;
      residualSumSquares += res * res;
    }

    const rSquared = totalVariationY === 0
      ? 0
      : Math.max(0, Math.min(1, 1 - (residualSumSquares / totalVariationY)));

    const sustainedMinutes = Math.round(x[n - 1] - x[0]);
    const latestHeap = y[n - 1];

    // Check leak criteria: positive slope exceeding threshold, sustained >= 25 mins, R^2 > 0.85
    const isLeakSuspected =
      slope >= this.leakSlopeThresholdBytesPerMin &&
      rSquared >= this.minRSquared &&
      sustainedMinutes >= 20;

    let projectedOomMinutes: number | null = null;
    if (slope > 0 && latestHeap < this.oomThresholdBytes) {
      projectedOomMinutes = Math.round((this.oomThresholdBytes - latestHeap) / slope);
    }

    return {
      isLeakSuspected,
      slopeBytesPerMinute: Math.round(slope),
      rSquaredScore: Math.round(rSquared * 1000) / 1000,
      sustainedGrowthMinutes: sustainedMinutes,
      projectedOomMinutes,
      sampleCount: n,
      currentHeapUsedMb: Math.round((latestHeap / (1024 * 1024)) * 100) / 100,
    };
  }

  public getSamples(): HeapSample[] {
    return [...this.samples];
  }

  public clear(): void {
    this.samples.length = 0;
  }
}
