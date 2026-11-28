import test from 'node:test';
import assert from 'node:assert/strict';

class CommitLogArchiverService {
  archiveColdRecords(recordTimestamps, retentionDays = 90) {
    const cutoff = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    const coldRecords = recordTimestamps.filter(t => t < cutoff);
    return {
      recordsArchived: coldRecords.length,
      cutoffTimestamp: cutoff,
      archiveChunkId: 'chunk-1',
      estimatedDiskReclaimedBytes: coldRecords.length * 256
    };
  }
}

test('CommitLogArchiverService - archives cold commit logs past retention boundary', () => {
  const service = new CommitLogArchiverService();
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const records = [now - 10 * day, now - 100 * day, now - 200 * day];

  const res = service.archiveColdRecords(records, 90);
  assert.equal(res.recordsArchived, 2);
  assert.ok(res.estimatedDiskReclaimedBytes > 0);
});
