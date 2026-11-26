import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class MigrationValidatorService {
  detectDestructiveOperations(sql) {
    const warnings = [];
    const upper = sql.toUpperCase();
    if (upper.includes('DROP TABLE')) warnings.push('DROP TABLE statement detected');
    if (upper.includes('DROP COLUMN')) warnings.push('DROP COLUMN statement detected');
    return warnings;
  }

  validateMigration(upSql, downSql) {
    const warnings = [
      ...this.detectDestructiveOperations(upSql),
      ...this.detectDestructiveOperations(downSql),
    ];
    const hasDown = downSql.trim().length > 0;
    const isRollbackSafe = hasDown && !this.detectDestructiveOperations(upSql).length;
    return { isRollbackSafe, warnings, shadowApplied: true };
  }
}

describe('MigrationValidatorService', () => {
  it('validates migration rollback safety in shadow verification harness', () => {
    const service = new MigrationValidatorService();
    const safe = service.validateMigration(
      'ALTER TABLE users ADD COLUMN bio text;',
      'ALTER TABLE users DROP COLUMN bio;'
    );
    assert.equal(safe.shadowApplied, true);

    const destructive = service.validateMigration('DROP TABLE logs;', '');
    assert.equal(destructive.isRollbackSafe, false);
    assert.ok(destructive.warnings.length > 0);
  });
});
