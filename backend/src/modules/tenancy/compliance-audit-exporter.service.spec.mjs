import test from 'node:test';
import assert from 'node:assert/strict';

class ComplianceAuditExporter {
  serializeToParquetBatch(records) {
    if (!records || records.length === 0) {
      throw new Error('Audit batch cannot be empty');
    }
    const tenantId = records[0].tenantId;
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const s3Key = `audit-logs/tenant=${tenantId}/year=${year}/month=${month}/batch_${Date.now()}.parquet`;

    return {
      batchId: `batch_${Date.now()}_${records.length}`,
      rowCount: records.length,
      s3Key,
      schemaVersion: '1.2.0'
    };
  }

  filterRecordsByCompliance(records, allowedActionPrefixes) {
    return records.filter(r => allowedActionPrefixes.some(prefix => r.action.startsWith(prefix)));
  }
}

test('ComplianceAuditExporter - prepares S3 parquet partition keys and filters audit records', () => {
  const exporter = new ComplianceAuditExporter();
  const records = [
    { recordId: '1', tenantId: 'enterprise-a', actorId: 'u1', action: 'auth.login', resource: '/login', timestamp: 1000, ipAddress: '127.0.0.1' },
    { recordId: '2', tenantId: 'enterprise-a', actorId: 'u1', action: 'data.export', resource: '/export', timestamp: 2000, ipAddress: '127.0.0.1' },
    { recordId: '3', tenantId: 'enterprise-a', actorId: 'u2', action: 'user.delete', resource: '/users/5', timestamp: 3000, ipAddress: '127.0.0.1' }
  ];
  const batch = exporter.serializeToParquetBatch(records);
  assert.strictEqual(batch.rowCount, 3);
  assert.match(batch.s3Key, /^audit-logs\/tenant=enterprise-a\/year=\d{4}\/month=\d{2}\//);

  const authLogs = exporter.filterRecordsByCompliance(records, ['auth.']);
  assert.strictEqual(authLogs.length, 1);
  assert.strictEqual(authLogs[0].action, 'auth.login');
});
