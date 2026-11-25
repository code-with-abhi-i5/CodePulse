import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DatabasePitrVerificationDaemonService } from './db-data-44.service.ts';

describe('DatabasePitrVerificationDaemonService (DB-DATA-44)', () => {
  it('validates point-in-time recovery WAL continuity and row count assertions', () => {
    const daemon = new DatabasePitrVerificationDaemonService();
    const target = {
      recoveryTargetTime: '2026-11-25T08:00:00Z',
      walSegmentStart: '000000010000000000000001',
      walSegmentEnd: '000000010000000000000005',
      expectedRecordCounts: { users: 150, submissions: 1200 }
    };

    const res = daemon.verifyRecoveryTarget(target, { users: 150, submissions: 1200 }, true);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.errors.length, 0);

    const failRes = daemon.verifyRecoveryTarget(target, { users: 150, submissions: 1100 }, false);
    assert.strictEqual(failRes.success, false);
    assert.strictEqual(failRes.errors.length, 2);
  });
});
