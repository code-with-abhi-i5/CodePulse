import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseRlsPolicyEngineService } from './db-data-31.service.ts';

describe('DatabaseRlsPolicyEngineService (DB-DATA-31)', () => {
  it('sets and resets local session variable for RLS tenant isolation', async () => {
    const engine = new DatabaseRlsPolicyEngineService();
    const executedQueries = [];
    const mockClient = {
      query: async (sql) => executedQueries.push(sql)
    };

    const res = await engine.executeInTenantContext('tenant-777', async () => 'data_result', mockClient);

    assert.strictEqual(res, 'data_result');
    assert.strictEqual(executedQueries.length, 2);
    assert.strictEqual(executedQueries[0], "SET LOCAL app.current_tenant = 'tenant-777';");
    assert.strictEqual(executedQueries[1], "RESET app.current_tenant;");
  });
});
