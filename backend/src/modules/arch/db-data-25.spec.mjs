import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ClickHouseDistributedQueryOptimizerService } from './db-data-25.service.ts';

describe('ClickHouseDistributedQueryOptimizerService (DB-DATA-25)', () => {
  it('detects missing sharding key causing expensive cluster fan-out', () => {
    const optimizer = new ClickHouseDistributedQueryOptimizerService('tenant_id');

    const badQuery = 'SELECT count(*) FROM distributed_events WHERE status = 1';
    const badRes = optimizer.optimizeQuery(badQuery);
    assert.strictEqual(badRes.fansOutToAllNodes, true);
    assert.ok(badRes.warning.includes('causing full cluster node fan-out'));

    const goodQuery = 'SELECT count(*) FROM distributed_events WHERE tenant_id = 42 AND status = 1';
    const goodRes = optimizer.optimizeQuery(goodQuery);
    assert.strictEqual(goodRes.fansOutToAllNodes, false);
    assert.strictEqual(goodRes.isOptimized, true);
  });
});
