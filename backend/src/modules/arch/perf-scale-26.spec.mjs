import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RedisMemoryEvictionAnalyzerService } from './perf-scale-26.service.ts';

describe('RedisMemoryEvictionAnalyzerService (PERF-SCALE-26)', () => {
  it('detects critical alert level when maxmemory exceeds 85%', () => {
    const analyzer = new RedisMemoryEvictionAnalyzerService();
    const res = analyzer.analyzeMemory({
      usedBytes: 880000000,
      maxBytes: 1000000000,
      evictedKeysTotal: 50,
      currentPolicy: 'volatile-lru'
    });

    assert.strictEqual(res.utilizationPercent, 88);
    assert.strictEqual(res.alertLevel, 'CRITICAL');
  });

  it('recommends allkeys-lru when running noeviction on high usage', () => {
    const analyzer = new RedisMemoryEvictionAnalyzerService();
    const res = analyzer.analyzeMemory({
      usedBytes: 800000000,
      maxBytes: 1000000000,
      evictedKeysTotal: 0,
      currentPolicy: 'noeviction'
    });

    assert.strictEqual(res.alertLevel, 'WARNING');
    assert.strictEqual(res.recommendedPolicy, 'allkeys-lru');
  });
});
