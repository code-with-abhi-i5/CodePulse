import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OptimisticConcurrencyVersionService } from './db-data-14.service.ts';

describe('OptimisticConcurrencyVersionService (DB-DATA-14)', () => {
  it('updates version and commits successfully when version matches', async () => {
    const occ = new OptimisticConcurrencyVersionService();
    const entity = { id: 'e-1', version: 1, data: { counter: 10 } };

    const res = await occ.executeMutationWithOcc(
      entity,
      (curr) => ({ counter: curr.data.counter + 1 }),
      async (id, expected, next, data) => expected === 1
    );

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.finalVersion, 2);
  });
});
