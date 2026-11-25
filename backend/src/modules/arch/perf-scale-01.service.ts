/**
 * Architecture Service: V8 Heap Memory Leak Sentinel
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-01]
 */

export interface HeapSample {
  timestamp: number;
  heapUsedBytes: number;
  heapTotalBytes: number;
  externalBytes: number;
}

export interface LeakSentinelAnalysis {
  isLeaking: boolean;
  growthRateBytesPerSec: number;
  consecutiveGrowthWindows: number;
  recommendSnapshot: boolean;
}

export class V8HeapMemoryLeakSentinelService {
  private samples: HeapSample[];
  private maxSamples: number;
  private sustainedGrowthThreshold: number;

  constructor(maxSamples: number = 20, sustainedGrowthThreshold: number = 4) {
    this.samples = [];
    this.maxSamples = maxSamples;
    this.sustainedGrowthThreshold = sustainedGrowthThreshold;
  }

  public recordSample(heapUsedBytes: number, heapTotalBytes: number, externalBytes: number = 0, timestamp: number = Date.now()): void {
    this.samples.push({
      timestamp,
      heapUsedBytes,
      heapTotalBytes,
      externalBytes
    });
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }

  public analyzeGrowth(): LeakSentinelAnalysis {
    if (this.samples.length < 2) {
      return { isLeaking: false, growthRateBytesPerSec: 0, consecutiveGrowthWindows: 0, recommendSnapshot: false };
    }

    let consecutiveGrowth = 0;
    for (let i = 1; i < this.samples.length; i++) {
      if (this.samples[i].heapUsedBytes > this.samples[i - 1].heapUsedBytes) {
        consecutiveGrowth++;
      } else {
        consecutiveGrowth = 0;
      }
    }

    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const timeDeltaSec = Math.max(1, (last.timestamp - first.timestamp) / 1000);
    const growthRate = Math.round((last.heapUsedBytes - first.heapUsedBytes) / timeDeltaSec);

    const isLeaking = consecutiveGrowth >= this.sustainedGrowthThreshold && growthRate > 0;
    return {
      isLeaking,
      growthRateBytesPerSec: Math.max(0, growthRate),
      consecutiveGrowthWindows: consecutiveGrowth,
      recommendSnapshot: isLeaking
    };
  }
}
