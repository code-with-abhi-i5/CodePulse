import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseQueryRouterService } from './perf-scale-23.service.ts';

describe('DatabaseQueryRouterService (PERF-SCALE-23)', () => {
  it('routes write operations exclusively to primary node', () => {
    const router = new DatabaseQueryRouterService('db-master', ['db-rep-1', 'db-rep-2']);
    const r1 = router.routeQuery('INSERT INTO battles (title) VALUES ("Speed Run")');
    assert.strictEqual(r1.targetNodeId, 'db-master');
    assert.strictEqual(r1.role, 'PRIMARY');

    const r2 = router.routeQuery('UPDATE users SET rating = 2000 WHERE id = 1');
    assert.strictEqual(r2.targetNodeId, 'db-master');
  });

  it('routes read queries across replicas round-robin and falls back to primary if all replicas down', () => {
    const router = new DatabaseQueryRouterService('db-master', ['db-rep-1', 'db-rep-2']);
    const r1 = router.routeQuery('SELECT * FROM leaderboard');
    assert.strictEqual(r1.targetNodeId, 'db-rep-1');

    const r2 = router.routeQuery('SELECT * FROM users');
    assert.strictEqual(r2.targetNodeId, 'db-rep-2');

    // Mark all replicas down
    router.setReplicaHealth('db-rep-1', false);
    router.setReplicaHealth('db-rep-2', false);

    const r3 = router.routeQuery('SELECT * FROM matches');
    assert.strictEqual(r3.targetNodeId, 'db-master');
  });
});
