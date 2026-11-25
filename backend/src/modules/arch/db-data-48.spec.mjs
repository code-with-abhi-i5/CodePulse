import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OptimisticLockingVersionValidatorService } from './db-data-48.service.ts';

describe('OptimisticLockingVersionValidatorService (DB-DATA-48)', () => {
  it('prepares versioned UPDATE statement and increments version safely', () => {
    const validator = new OptimisticLockingVersionValidatorService();
    const result = validator.validateAndPrepareUpdate('users', 'u-1', 4, { score: 100 });

    assert.strictEqual(result.nextVersion, 5);
    assert.ok(result.sql.includes('version = 5'));
    assert.ok(result.sql.includes('WHERE id = :id AND version = 4'));
  });
});
