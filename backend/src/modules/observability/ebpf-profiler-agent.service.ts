import { Injectable } from '@nestjs/common';
import { EbpfProfileSample, OffCpuStats } from '../../types/observability';

@Injectable()
export class EbpfProfilerAgentService {
  private samples: EbpfProfileSample[] = [];

  recordSample(sample: EbpfProfileSample): void {
    this.samples.push(sample);
  }

  computeStats(): OffCpuStats {
    if (this.samples.length === 0) {
      return { totalDurationNs: 0, sampleCount: 0, p50Ns: 0, p90Ns: 0, p99Ns: 0, topBottlenecks: [] };
    }

    const durations = this.samples.map(s => s.offCpuDurationNs).sort((a, b) => a - b);
    const totalDurationNs = durations.reduce((acc, d) => acc + d, 0);

    const p50Idx = Math.floor(durations.length * 0.5);
    const p90Idx = Math.floor(durations.length * 0.9);
    const p99Idx = Math.min(Math.floor(durations.length * 0.99), durations.length - 1);

    const symbolMap = new Map<string, { durationNs: number; count: number }>();
    for (const sample of this.samples) {
      const sym = sample.lockSymbol || sample.stackTrace[sample.stackTrace.length - 1] || 'unknown';
      const existing = symbolMap.get(sym) || { durationNs: 0, count: 0 };
      existing.durationNs += sample.offCpuDurationNs;
      existing.count += 1;
      symbolMap.set(sym, existing);
    }

    const topBottlenecks = Array.from(symbolMap.entries())
      .map(([symbol, data]) => ({ symbol, ...data }))
      .sort((a, b) => b.durationNs - a.durationNs)
      .slice(0, 5);

    return {
      totalDurationNs,
      sampleCount: this.samples.length,
      p50Ns: durations[p50Idx] || 0,
      p90Ns: durations[p90Idx] || 0,
      p99Ns: durations[p99Idx] || 0,
      topBottlenecks
    };
  }

  clear(): void {
    this.samples = [];
  }
}
