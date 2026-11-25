import assert from 'node:assert/strict';
import { BackupVerificationDaemonService } from './devops-infra-07.service.ts';

const daemon = new BackupVerificationDaemonService();

const meta = {
  snapshotId: 'snap-2026-11-25',
  sizeBytes: 104857600,
  checksum: 'sha256:abc123def456',
  createdAt: Date.now()
};

const report = await daemon.verifySnapshot(meta, async (s) => {
  return { tables: 24, records: 450000 };
});

assert.strictEqual(report.verified, true);
assert.strictEqual(report.restoredTablesCount, 24);
assert.strictEqual(report.totalRecordsCount, 450000);
assert.strictEqual(report.errors.length, 0);

console.log('Issue #3087 [DEVOPS-INFRA-07] spec passed successfully.');
