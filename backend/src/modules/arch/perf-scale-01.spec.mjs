import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { V8HeapMemoryLeakSentinelService } from './perf-scale-01.service.ts';

describe('V8HeapMemoryLeakSentinelService (PERF-SCALE-01)', () => {
  it('detects sustained heap memory growth and recommends snapshot', () => {
    const sentinel = new V8HeapMemoryLeakSentinelService(10, 3);
    for (let i = 1; i <= 5; i++) {
      sentinel.recordSample(i * 10000000, 100000000, 0, i * 1000);
    }

    const analysis = sentinel.analyzeGrowth();
    assert.strictEqual(analysis.isLeaking, true);
    assert.strictEqual(analysis.recommendSnapshot, true);
    assert.ok(analysis.growthRateBytesPerSec > 0);
  });

  it('recognizes healthy memory profile with periodic GC reductions', () => {
    const sentinel = new V8HeapMemoryLeakSentinelService(10, 3);
    sentinel.recordSample(50000000, 100000000, 0, 1000);
    sentinel.recordSample(60000000, 100000000, 0, 2000);
    sentinel.recordSample(30000000, 100000000, 0, 3000); // GC reclamation

    const analysis = sentinel.analyzeGrowth();
    assert.strictEqual(analysis.isLeaking, false);
    assert.strictEqual(analysis.recommendSnapshot, false);
  });
});
