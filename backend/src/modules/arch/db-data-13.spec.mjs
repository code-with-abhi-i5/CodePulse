import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseConnectionPoolWarmUpWorkerService } from './db-data-13.service.ts';

describe('DatabaseConnectionPoolWarmUpWorkerService (DB-DATA-13)', () => {
  it('pre-warms minimum connection pool size concurrently during cold boot', async () => {
    const worker = new DatabaseConnectionPoolWarmUpWorkerService();
    const result = await worker.warmUpPool(5, async (idx) => true);

    assert.strictEqual(result.warmedCount, 5);
    assert.strictEqual(result.failedCount, 0);
  });
});
