import test from 'node:test';
import assert from 'node:assert/strict';

class ModelThroughputBenchmarkService {
  constructor() {
    this.defaultTpsSlo = 25.0;
  }

  evaluateThroughput(modelName, totalTokens, durationMs, timeToFirstTokenMs) {
    const durationSeconds = Math.max(durationMs / 1000, 0.001);
    const tokensPerSecond = Math.round((totalTokens / durationSeconds) * 100) / 100;
    const isWithinSlo = tokensPerSecond >= this.defaultTpsSlo && timeToFirstTokenMs <= 1500;

    return {
      modelName,
      totalTokens,
      durationMs,
      timeToFirstTokenMs,
      tokensPerSecond,
      isWithinSlo
    };
  }
}

test('ModelThroughputBenchmarkService - evaluates TPS and SLO compliance accurately', () => {
  const service = new ModelThroughputBenchmarkService();
  const fastRun = service.evaluateThroughput('gpt-4o', 120, 2000, 300);
  assert.equal(fastRun.tokensPerSecond, 60);
  assert.equal(fastRun.isWithinSlo, true);

  const slowRun = service.evaluateThroughput('legacy-llama', 20, 2000, 2000);
  assert.equal(slowRun.tokensPerSecond, 10);
  assert.equal(slowRun.isWithinSlo, false);
});
