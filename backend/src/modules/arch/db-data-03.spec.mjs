import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ZeroDowntimeMigrationRollbackService } from './db-data-03.service.ts';

describe('ZeroDowntimeMigrationRollbackService (DB-DATA-03)', () => {
  it('rejects destructive column drops and un-defaulted non-nullable additions', () => {
    const coordinator = new ZeroDowntimeMigrationRollbackService();
    const result = coordinator.validateMigrationSafety([
      { name: 'col_a', type: 'ADD_COLUMN', nullable: true },
      { name: 'col_b', type: 'DROP_COLUMN' },
      { name: 'col_c', type: 'ADD_COLUMN', nullable: false, hasDefault: false }
    ]);

    assert.strictEqual(result.isSafe, false);
    assert.strictEqual(result.violations.length, 2);
  });
});
