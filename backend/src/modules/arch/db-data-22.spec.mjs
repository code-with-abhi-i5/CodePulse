import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DynamicDatabaseShardRouterService } from './db-data-22.service.ts';

describe('DynamicDatabaseShardRouterService (DB-DATA-22)', () => {
  it('deterministically distributes tenant queries across shards using consistent hash ring', () => {
    const router = new DynamicDatabaseShardRouterService(['shard-0', 'shard-1', 'shard-2']);

    const s1 = router.getShardForTenant('tenant-100');
    const s2 = router.getShardForTenant('tenant-100');
    assert.strictEqual(s1, s2); // deterministic

    const s3 = router.getShardForTenant('tenant-456');
    assert.ok(['shard-0', 'shard-1', 'shard-2'].includes(s3));
  });
});
