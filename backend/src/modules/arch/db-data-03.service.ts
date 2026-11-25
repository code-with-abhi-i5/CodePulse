/**
 * Architecture Service: Zero-Downtime Database Migration Safety Coordinator
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-03]
 */

export interface MigrationStep {
  name: string;
  type: 'ADD_COLUMN' | 'DROP_COLUMN' | 'RENAME_COLUMN' | 'ADD_INDEX' | 'CREATE_TABLE';
  nullable?: boolean;
  hasDefault?: boolean;
  isExpandPhase?: boolean;
}

export class ZeroDowntimeMigrationRollbackService {
  public validateMigrationSafety(steps: MigrationStep[]): {
    isSafe: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    for (const step of steps) {
      if (step.type === 'DROP_COLUMN') {
        violations.push(`Destructive operation '${step.name}': DROP_COLUMN violates zero-downtime safety; use expand-and-contract phase deprecation.`);
      } else if (step.type === 'RENAME_COLUMN') {
        violations.push(`Breaking operation '${step.name}': RENAME_COLUMN violates backward compatibility; add new column and backfill.`);
      } else if (step.type === 'ADD_COLUMN' && !step.nullable && !step.hasDefault) {
        violations.push(`Non-nullable column addition '${step.name}' without default value locks table and breaks old application instances.`);
      }
    }

    return {
      isSafe: violations.length === 0,
      violations
    };
  }
}
