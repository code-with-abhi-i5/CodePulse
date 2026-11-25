import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class EbpfProfilerAgentService {
  constructor() {
    this.samples = [];
  }

  recordSample(sample) {
    this.samples.push(sample);
  }

  computeStats() {
    if (this.samples.length === 0) {
      return { totalDurationNs: 0, sampleCount: 0, p50Ns: 0, p90Ns: 0, p99Ns: 0, topBottlenecks: [] };
    }

    const durations = this.samples.map(s => s.offCpuDurationNs).sort((a, b) => a - b);
    const totalDurationNs = durations.reduce((acc, d) => acc + d, 0);

    const p50Idx = Math.floor(durations.length * 0.5);
    const p90Idx = Math.floor(durations.length * 0.9);
    const p99Idx = Math.min(Math.floor(durations.length * 0.99), durations.length - 1);

    const symbolMap = new Map();
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

  clear() {
    this.samples = [];
  }
}

describe('EbpfProfilerAgentService', () => {
  it('captures off-cpu profiling stack traces and computes percentiles and lock bottlenecks', () => {
    const service = new EbpfProfilerAgentService();
    service.recordSample({
      timestamp: Date.now(),
      pid: 1042,
      comm: 'node',
      stackTrace: ['uv__io_poll', 'epoll_wait'],
      offCpuDurationNs: 1000000,
      lockSymbol: 'sys_epoll_wait'
    });
    service.recordSample({
      timestamp: Date.now(),
      pid: 1042,
      comm: 'node',
      stackTrace: ['mutex_lock', '__futex_wait'],
      offCpuDurationNs: 5000000,
      lockSymbol: 'futex_wait_queue'
    });
    service.recordSample({
      timestamp: Date.now(),
      pid: 1042,
      comm: 'node',
      stackTrace: ['mutex_lock', '__futex_wait'],
      offCpuDurationNs: 4000000,
      lockSymbol: 'futex_wait_queue'
    });

    const stats = service.computeStats();
    assert.strictEqual(stats.sampleCount, 3);
    assert.strictEqual(stats.totalDurationNs, 10000000);
    assert.ok(stats.p50Ns >= 4000000);
    assert.strictEqual(stats.topBottlenecks[0].symbol, 'futex_wait_queue');
    assert.strictEqual(stats.topBottlenecks[0].count, 2);
  });
});
