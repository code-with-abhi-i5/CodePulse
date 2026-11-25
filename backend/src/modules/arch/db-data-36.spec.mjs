import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MultiDatabaseTransactionManagerService } from './db-data-36.service.ts';

describe('MultiDatabaseTransactionManagerService (DB-DATA-36)', () => {
  it('executes saga successfully across postgres and mongo', async () => {
    const manager = new MultiDatabaseTransactionManagerService();
    const actions = [];

    const result = await manager.executeSaga([
      { name: 'postgres_insert', execute: async () => actions.push('pg_done'), compensate: async () => actions.push('pg_undone') },
      { name: 'mongo_insert', execute: async () => actions.push('mongo_done'), compensate: async () => actions.push('mongo_undone') }
    ]);

    assert.strictEqual(result.success, true);
    assert.deepStrictEqual(actions, ['pg_done', 'mongo_done']);
  });

  it('triggers compensation rollback when downstream database fails', async () => {
    const manager = new MultiDatabaseTransactionManagerService();
    const actions = [];

    const result = await manager.executeSaga([
      { name: 'postgres_insert', execute: async () => actions.push('pg_done'), compensate: async () => actions.push('pg_undone') },
      { name: 'mongo_insert', execute: async () => { throw new Error('Mongo connection dropped'); }, compensate: async () => actions.push('mongo_undone') }
    ]);

    assert.strictEqual(result.success, false);
    assert.deepStrictEqual(result.compensatedSteps, ['postgres_insert']);
    assert.deepStrictEqual(actions, ['pg_done', 'pg_undone']);
  });
});
