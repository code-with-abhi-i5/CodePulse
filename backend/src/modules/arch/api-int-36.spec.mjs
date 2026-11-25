import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GraphqlMutationTransactionManagerService } from './api-int-36.service.ts';

describe('GraphqlMutationTransactionManagerService (API-INT-36)', () => {
  it('commits all steps on success and rolls back on any step failure', async () => {
    const txManager = new GraphqlMutationTransactionManagerService();
    let committed = false;
    let rolledBack = false;

    // Successful run
    const success = await txManager.executeInTransaction(
      [async () => 'step1', async () => 'step2'],
      async () => { committed = true; },
      async () => { rolledBack = true; }
    );
    assert.strictEqual(success, true);
    assert.strictEqual(committed, true);

    // Failing run
    committed = false;
    rolledBack = false;
    const failure = await txManager.executeInTransaction(
      [async () => 'step1', async () => { throw new Error('DB Error'); }],
      async () => { committed = true; },
      async () => { rolledBack = true; }
    );
    assert.strictEqual(failure, false);
    assert.strictEqual(rolledBack, true);
  });
});
