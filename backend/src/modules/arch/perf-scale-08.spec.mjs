import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RouteMicroBenchmarkSuiteService } from './perf-scale-08.service.ts';

describe('RouteMicroBenchmarkSuiteService (PERF-SCALE-08)', () => {
  it('benchmarks handler and measures average execution duration in nanoseconds', () => {
    const bench = new RouteMicroBenchmarkSuiteService();
    let sum = 0;
    const res = bench.runBenchmark('/api/health', 100, () => {
      sum += 1;
    });

    assert.strictEqual(res.iterations, 100);
    assert.ok(res.avgDurationNs >= 0);
    assert.ok(res.p99DurationNs >= res.avgDurationNs);
  });

  it('detects performance regression when average duration exceeds baseline by 25%', () => {
    const bench = new RouteMicroBenchmarkSuiteService();
    const res = bench.runBenchmark('/api/calc', 10, () => {
      // Small loop
      let x = 0;
      for (let i = 0; i < 1000; i++) x += i;
    }, 1); // Baseline of 1ns triggers regression

    assert.strictEqual(res.regressionDetected, true);
  });
});
