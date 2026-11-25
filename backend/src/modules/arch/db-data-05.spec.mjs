import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseReadReplicaLagMonitorService } from './db-data-05.service.ts';

describe('DatabaseReadReplicaLagMonitorService (DB-DATA-05)', () => {
  it('routes to lowest-lag replica and falls back to primary when all replicas lag', () => {
    const monitor = new DatabaseReadReplicaLagMonitorService(2000);

    const normal = monitor.selectHealthyReplica([
      { replicaId: 'rep-1', lagMs: 500, isOnline: true },
      { replicaId: 'rep-2', lagMs: 1500, isOnline: true }
    ]);
    assert.strictEqual(normal.selectedReplicaId, 'rep-1');
    assert.strictEqual(normal.reroutedDueToLag, false);

    const lagging = monitor.selectHealthyReplica([
      { replicaId: 'rep-1', lagMs: 3500, isOnline: true },
      { replicaId: 'rep-2', lagMs: 4000, isOnline: true }
    ]);
    assert.strictEqual(lagging.selectedReplicaId, 'PRIMARY_FALLBACK');
    assert.strictEqual(lagging.reroutedDueToLag, true);
  });
});
