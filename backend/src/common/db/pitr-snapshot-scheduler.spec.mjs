import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class PitrSnapshotSchedulerService {
  constructor(config) {
    this.config = config;
  }

  calculateNextSnapshotTime(lastSnapshotTimestamp, now = Date.now()) {
    const intervalMs = this.config.snapshotIntervalMinutes * 60 * 1000;
    const nextTime = lastSnapshotTimestamp + intervalMs;
    return nextTime <= now ? now : nextTime;
  }

  validateRecoveryTarget(targetTimestamp, baseBackupTimestamp, availableSegments) {
    const missingSegments = [];
    if (targetTimestamp < baseBackupTimestamp) {
      return {
        isValid: false,
        baseBackupTimestamp,
        targetRecoveryTime: targetTimestamp,
        availableWalRange: { start: availableSegments[0] || '', end: availableSegments[availableSegments.length - 1] || '' },
        missingWalSegments: ['Target timestamp is older than base backup timestamp']
      };
    }

    if (availableSegments.length === 0) {
      missingSegments.push('No WAL archive segments found');
    }

    const isValid = missingSegments.length === 0 && targetTimestamp >= baseBackupTimestamp;
    return {
      isValid,
      baseBackupTimestamp,
      targetRecoveryTime: targetTimestamp,
      availableWalRange: {
        start: availableSegments[0] || '',
        end: availableSegments[availableSegments.length - 1] || ''
      },
      missingWalSegments: missingSegments
    };
  }

  shouldPruneSnapshot(snapshotTimestamp, now = Date.now()) {
    const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;
    return (now - snapshotTimestamp) > retentionMs;
  }
}

describe('PitrSnapshotSchedulerService', () => {
  const service = new PitrSnapshotSchedulerService({
    retentionDays: 7,
    snapshotIntervalMinutes: 60,
    walArchiveBucket: 's3://backups/wal'
  });

  it('calculates next snapshot time when upcoming and when overdue', () => {
    const last = 1000000;
    const next = service.calculateNextSnapshotTime(last, 1000000);
    assert.equal(next, 1000000 + 3600000);

    const overdue = service.calculateNextSnapshotTime(last, 6000000);
    assert.equal(overdue, 6000000);
  });

  it('validates recovery target time against base backup and available WALs', () => {
    const resValid = service.validateRecoveryTarget(2000, 1000, ['000000010000000000000001', '000000010000000000000002']);
    assert.equal(resValid.isValid, true);
    assert.equal(resValid.missingWalSegments.length, 0);

    const resTooOld = service.validateRecoveryTarget(500, 1000, ['00000001']);
    assert.equal(resTooOld.isValid, false);
    assert.ok(resTooOld.missingWalSegments[0].includes('older than base backup'));

    const resNoWal = service.validateRecoveryTarget(2000, 1000, []);
    assert.equal(resNoWal.isValid, false);
    assert.ok(resNoWal.missingWalSegments[0].includes('No WAL'));
  });

  it('determines whether old snapshots should be pruned according to retention policy', () => {
    const now = 10 * 24 * 60 * 60 * 1000;
    const recent = now - (2 * 24 * 60 * 60 * 1000);
    const expired = now - (8 * 24 * 60 * 60 * 1000);

    assert.equal(service.shouldPruneSnapshot(recent, now), false);
    assert.equal(service.shouldPruneSnapshot(expired, now), true);
  });
});
