import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseBackupSnapshotValidatorService } from './db-data-24.service.ts';

describe('DatabaseBackupSnapshotValidatorService (DB-DATA-24)', () => {
  it('validates snapshot checksum and restored table sanity checks', () => {
    const validator = new DatabaseBackupSnapshotValidatorService();
    const meta = {
      snapshotId: 'snap-20261125',
      expectedTables: ['users', 'challenges'],
      expectedMinRowCount: 100,
      checksum: 'sha256-abc123'
    };

    const validResult = validator.validateSnapshot(meta, 'sha256-abc123', { users: 60, challenges: 50 });
    assert.strictEqual(validResult.isValid, true);

    const corruptResult = validator.validateSnapshot(meta, 'sha256-wrong', { users: 60, challenges: 50 });
    assert.strictEqual(corruptResult.isValid, false);
    assert.ok(corruptResult.issues[0].includes('Checksum mismatch'));
  });
});
