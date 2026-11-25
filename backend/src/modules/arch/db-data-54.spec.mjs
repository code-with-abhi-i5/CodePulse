import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DistributedLockHeartbeatService } from './db-data-54.service.ts';

describe('DistributedLockHeartbeatService (DB-DATA-54)', () => {
  it('acquires, renews heartbeats, and releases locks safely', () => {
    const service = new DistributedLockHeartbeatService();

    // Acquire
    assert.strictEqual(service.acquireLock('job-1', 'worker-A', 5000), true);

    // Another worker fails
    assert.strictEqual(service.acquireLock('job-1', 'worker-B', 5000), false);

    // Worker A renews heartbeat
    assert.strictEqual(service.renewHeartbeat('job-1', 'worker-A'), true);

    // Worker A releases
    assert.strictEqual(service.releaseLock('job-1', 'worker-A'), true);

    // Worker B can now acquire
    assert.strictEqual(service.acquireLock('job-1', 'worker-B', 5000), true);
  });
});
