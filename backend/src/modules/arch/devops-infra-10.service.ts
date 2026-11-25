/**
 * Architecture Service: Zero-Downtime Database Migration Runner
 * Subsystem: Advanced DevOps & Infrastructure Automation [DEVOPS-INFRA-10]
 */

export interface MigrationCheckResult {
  migrationName: string;
  isBackwardCompatible: boolean;
  violations: string[];
}

export class ZeroDowntimeMigrationRunnerService {
  private static readonly DANGEROUS_PATTERNS = [
    { regex: /DROP\s+COLUMN/i, msg: 'Dropping columns directly breaks active code running older schema versions' },
    { regex: /RENAME\s+COLUMN/i, msg: 'Renaming columns directly breaks active queries' },
    { regex: /ALTER\s+TABLE\s+.*\s+ADD\s+COLUMN\s+.*\s+NOT\s+NULL(?!\s+DEFAULT)/i, msg: 'Adding NOT NULL column without DEFAULT locks table and fails on existing rows' },
    { regex: /DROP\s+TABLE/i, msg: 'Dropping tables directly may cause runtime errors for concurrent pods' }
  ];

  public analyzeMigration(migrationName: string, sqlContent: string): MigrationCheckResult {
    const violations: string[] = [];

    for (const pattern of ZeroDowntimeMigrationRunnerService.DANGEROUS_PATTERNS) {
      if (pattern.regex.test(sqlContent)) {
        violations.push(pattern.msg);
      }
    }

    return {
      migrationName,
      isBackwardCompatible: violations.length === 0,
      violations
    };
  }
}
