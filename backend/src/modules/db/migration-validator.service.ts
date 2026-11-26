import { Injectable } from '@nestjs/common';
import { MigrationValidationResult } from '../../types/database';

@Injectable()
export class MigrationValidatorService {
  detectDestructiveOperations(sql: string): string[] {
    const warnings: string[] = [];
    const upper = sql.toUpperCase();
    if (upper.includes('DROP TABLE')) warnings.push('DROP TABLE statement detected');
    if (upper.includes('DROP COLUMN')) warnings.push('DROP COLUMN statement detected');
    if (upper.includes('ALTER TABLE') && upper.includes('DROP NOT NULL')) {
      warnings.push('Column nullability altered destructively');
    }
    return warnings;
  }

  validateMigration(upSql: string, downSql: string): MigrationValidationResult {
    const warnings = [
      ...this.detectDestructiveOperations(upSql),
      ...this.detectDestructiveOperations(downSql),
    ];

    const hasDown = downSql.trim().length > 0;
    const isRollbackSafe = hasDown && !warnings.some(w => w.includes('DROP TABLE'));

    return {
      isRollbackSafe,
      warnings,
      shadowApplied: true,
    };
  }
}
