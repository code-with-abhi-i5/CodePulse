import assert from 'node:assert/strict';
import { DistributedLockOptimizerService } from './perf-scale-32.service.ts';

const lockService = new DistributedLockOptimizerService({
  baseBackoffMs: 10,
  maxBackoffMs: 100,
  jitterFactor: 0.2,
  maxAttempts: 3,
  lockTtlMs: 500
});

const b1 = lockService.calculateBackoff(0, () => 0.5);
assert.strictEqual(b1 >= 10, true);

const lock1 = await lockService.acquireLock('res-1');
assert.strictEqual(lock1.acquired, true);
assert.strictEqual(lockService.isLocked('res-1'), true);

let mockSlept = 0;
const lock2 = await lockService.acquireLock('res-1', async (ms) => { mockSlept += ms; });
assert.strictEqual(lock2.acquired, false);
assert.strictEqual(lock2.attempts, 3);
assert.ok(mockSlept > 0);

const released = lockService.releaseLock('res-1', lock1.token);
assert.strictEqual(released, true);
assert.strictEqual(lockService.isLocked('res-1'), false);

console.log('Issue #3067 [PERF-SCALE-32] spec passed successfully.');
