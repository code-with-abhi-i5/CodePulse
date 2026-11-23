import { Injectable, Logger } from '@nestjs/common';
import { MigrationHazard, MigrationLintReport } from './migration-safety-linter.types';

@Injectable()
export class MigrationSafetyLinterService {
  private readonly logger = new Logger(MigrationSafetyLinterService.name);

  public lintSqlMigration(migrationName: string, sql: string): MigrationLintReport {
    const hazards: MigrationHazard[] = [];
    const statements = sql.split(';').map((s) => s.trim()).filter((s) => s.length > 0);

    let maxLock: MigrationLintReport['lockLevel'] = 'NONE';

    for (const stmt of statements) {
      const upper = stmt.toUpperCase();

      // Check unindexed Foreign Key
      if (upper.includes('ADD CONSTRAINT') && upper.includes('FOREIGN KEY') && !upper.includes('INDEX')) {
        hazards.push({
          ruleId: 'UNINDEXED_FOREIGN_KEY',
          tableName: this.extractTable(stmt),
          hazardLevel: 'CRITICAL',
          description: 'Adding a foreign key without a supporting index causes full table locks on referenced table deletes.',
          recommendation: 'Create index concurrently before applying foreign key constraint.',
          sqlSnippet: stmt,
        });
        maxLock = 'ACCESS_EXCLUSIVE';
      }

      // Check Default Value rewrite on existing table
      if (upper.includes('ALTER TABLE') && upper.includes('ADD COLUMN') && upper.includes('DEFAULT') && !upper.includes('NULL')) {
        hazards.push({
          ruleId: 'DEFAULT_REWRITE_HAZARD',
          tableName: this.extractTable(stmt),
          hazardLevel: 'WARNING',
          description: 'Adding non-null column with volatile default causes table rewrite.',
          recommendation: 'Add column as nullable, backfill values in batches, then set NOT NULL.',
          sqlSnippet: stmt,
        });
        if (maxLock !== 'ACCESS_EXCLUSIVE') maxLock = 'SHARE_UPDATE_EXCLUSIVE';
      }

      // Check Non-concurrent index creation
      if (upper.includes('CREATE INDEX') && !upper.includes('CONCURRENTLY')) {
        hazards.push({
          ruleId: 'NON_CONCURRENT_INDEX',
          tableName: this.extractTable(stmt),
          hazardLevel: 'CRITICAL',
          description: 'Standard CREATE INDEX takes SHARE lock, blocking all concurrent writes.',
          recommendation: 'Use CREATE INDEX CONCURRENTLY.',
          sqlSnippet: stmt,
        });
        maxLock = 'ACCESS_EXCLUSIVE';
      }
    }

    const passed = !hazards.some((h) => h.hazardLevel === 'CRITICAL');
    return {
      migrationName,
      passed,
      hazards,
      lockLevel: maxLock,
    };
  }

  private extractTable(stmt: string): string {
    const match = stmt.match(/ALTER TABLEs+["`]?([a-zA-Z0-9_]+)["`]?/i) || stmt.match(/ONs+["`]?([a-zA-Z0-9_]+)["`]?/i);
    return match ? match[1] : 'unknown_table';
  }
}
