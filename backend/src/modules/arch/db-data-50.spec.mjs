import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ClickHouseDecommissionCoordinatorService } from './db-data-50.service.ts';

describe('ClickHouseDecommissionCoordinatorService (DB-DATA-50)', () => {
  it('generates partition migration DDL evenly distributed across remaining cluster nodes', () => {
    const coordinator = new ClickHouseDecommissionCoordinatorService();
    const slices = [
      { tableName: 'events', partition: '202611_01', partCount: 5 },
      { tableName: 'events', partition: '202611_02', partCount: 4 }
    ];

    const plan = coordinator.planPartitionMigration('node-3', ['node-1', 'node-2'], slices);
    assert.strictEqual(plan.length, 2);
    assert.strictEqual(plan[0].targetNode, 'node-1');
    assert.strictEqual(plan[1].targetNode, 'node-2');
    assert.ok(plan[0].moveDdl.includes("MOVE PARTITION '202611_01' TO SHARD 'node-1'"));
  });
});
