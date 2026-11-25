import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseFailoverSwitcherService } from './db-data-39.service.ts';

describe('DatabaseFailoverSwitcherService (DB-DATA-39)', () => {
  it('seamlessly fails over to standby connection string after consecutive health check failures', () => {
    const switcher = new DatabaseFailoverSwitcherService(
      'postgres://primary:5432/codepulse',
      'postgres://standby:5432/codepulse',
      2
    );

    assert.strictEqual(switcher.getActiveConnection(), 'postgres://primary:5432/codepulse');

    // Failure 1
    const res1 = switcher.recordHealthCheck(false);
    assert.strictEqual(res1.failedOver, false);

    // Failure 2 (reaches threshold)
    const res2 = switcher.recordHealthCheck(false);
    assert.strictEqual(res2.failedOver, true);
    assert.strictEqual(switcher.getActiveConnection(), 'postgres://standby:5432/codepulse');
  });
});
