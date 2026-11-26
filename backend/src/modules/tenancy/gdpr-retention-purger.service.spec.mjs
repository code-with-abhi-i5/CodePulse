import test from 'node:test';
import assert from 'node:assert/strict';

class GdprRetentionPurger {
  purgeInactiveRecords(tenantId, records, retentionDays = 90) {
    const cutoffTimestamp = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    let recordsPurged = 0;
    let storageReclaimedMb = 0;

    for (const r of records) {
      if (r.tenantId === tenantId && r.lastActiveTimestamp < cutoffTimestamp) {
        recordsPurged++;
        storageReclaimedMb += r.dataSizeMb;
      }
    }

    return {
      tenantId,
      recordsEvaluated: records.length,
      recordsPurged,
      storageReclaimedMb: Number(storageReclaimedMb.toFixed(2)),
      status: 'completed'
    };
  }
}

test('GdprRetentionPurger - purges user records older than retention window', () => {
  const purger = new GdprRetentionPurger();
  const now = Date.now();
  const days100Ago = now - 100 * 24 * 60 * 60 * 1000;
  const days10Ago = now - 10 * 24 * 60 * 60 * 1000;

  const records = [
    { id: '1', tenantId: 't1', lastActiveTimestamp: days100Ago, dataSizeMb: 12.5 },
    { id: '2', tenantId: 't1', lastActiveTimestamp: days10Ago, dataSizeMb: 50.0 },
    { id: '3', tenantId: 't2', lastActiveTimestamp: days100Ago, dataSizeMb: 20.0 }
  ];

  const report = purger.purgeInactiveRecords('t1', records, 90);
  assert.strictEqual(report.recordsPurged, 1);
  assert.strictEqual(report.storageReclaimedMb, 12.5);
  assert.strictEqual(report.status, 'completed');
});
