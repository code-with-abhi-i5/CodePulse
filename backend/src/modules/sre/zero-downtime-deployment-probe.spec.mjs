import test from 'node:test';
import assert from 'node:assert/strict';

class ZeroDowntimeDeploymentProbe {
  validateDeployment(liveSchemaVersion, requiredSchemaVersion, replicasSynced) {
    if (liveSchemaVersion !== requiredSchemaVersion) {
      return {
        schemaVersion: liveSchemaVersion,
        expectedVersion: requiredSchemaVersion,
        replicasSynced,
        canShiftTraffic: false,
        reason: `Database schema version ${liveSchemaVersion} does not match expected ${requiredSchemaVersion}`
      };
    }

    if (!replicasSynced) {
      return {
        schemaVersion: liveSchemaVersion,
        expectedVersion: requiredSchemaVersion,
        replicasSynced,
        canShiftTraffic: false,
        reason: 'Read replicas are still synchronizing migration changes'
      };
    }

    return {
      schemaVersion: liveSchemaVersion,
      expectedVersion: requiredSchemaVersion,
      replicasSynced: true,
      canShiftTraffic: true
    };
  }
}

test('ZeroDowntimeDeploymentProbe - gates traffic shift on schema sync and replica readiness', () => {
  const probe = new ZeroDowntimeDeploymentProbe();
  const denied = probe.validateDeployment('20261101', '20261125', true);
  assert.strictEqual(denied.canShiftTraffic, false);

  const approved = probe.validateDeployment('20261125', '20261125', true);
  assert.strictEqual(approved.canShiftTraffic, true);
});
