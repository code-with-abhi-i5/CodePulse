import test from 'node:test';
import assert from 'node:assert/strict';

class CrossRegionReplicaLagMonitorService {
  measureLag(region, primaryTimestamp, replicaTimestamp) {
    const lagMs = Math.max(0, primaryTimestamp - replicaTimestamp);
    let status = 'HEALTHY';
    if (lagMs > 10000) status = 'CRITICAL';
    else if (lagMs > 5000) status = 'DEGRADED';
    return { region, lagMs, status, isEligibleForReads: status === 'HEALTHY' };
  }
}

test('CrossRegionReplicaLagMonitorService - flags replicas with high lag as degraded or critical', () => {
  const service = new CrossRegionReplicaLagMonitorService();
  const now = Date.now();
  const ok = service.measureLag('us-west', now, now - 500);
  assert.equal(ok.status, 'HEALTHY');
  assert.equal(ok.isEligibleForReads, true);

  const laggy = service.measureLag('eu-central', now, now - 6500);
  assert.equal(laggy.status, 'DEGRADED');
  assert.equal(laggy.isEligibleForReads, false);
});
