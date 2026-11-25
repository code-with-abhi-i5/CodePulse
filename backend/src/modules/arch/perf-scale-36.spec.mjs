import assert from 'node:assert/strict';
import { DynamicTimeoutEscalatorService } from './perf-scale-36.service.ts';

const escalator = new DynamicTimeoutEscalatorService({
  minTimeoutMs: 100,
  maxTimeoutMs: 2000,
  bufferMultiplier: 1.5,
  fallbackTimeoutMs: 300
});

assert.strictEqual(escalator.calculateTimeout('unknown-svc'), 300);

for (let i = 1; i <= 100; i++) {
  escalator.recordLatency('auth-svc', i * 2);
}

const p99 = escalator.getP99('auth-svc');
assert.strictEqual(p99, 200);

const timeout = escalator.calculateTimeout('auth-svc');
assert.strictEqual(timeout, 300);

console.log('Issue #3071 [PERF-SCALE-36] spec passed successfully.');
