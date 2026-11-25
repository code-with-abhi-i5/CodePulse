import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PrismaTransactionRetryCoordinatorService } from './db-data-17.service.ts';

describe('PrismaTransactionRetryCoordinatorService (DB-DATA-17)', () => {
  it('retries on serialization failure and succeeds when transient error clears', async () => {
    const coordinator = new PrismaTransactionRetryCoordinatorService(3, 10);
    let counter = 0;

    const op = async () => {
      counter++;
      if (counter < 2) {
        throw new Error('code 40001: could not serialize access due to read/write dependencies');
      }
      return 'success_data';
    };

    const res = await coordinator.executeWithRetry(op, async () => {});
    assert.strictEqual(res.result, 'success_data');
    assert.strictEqual(res.attempts, 2);
  });
});
