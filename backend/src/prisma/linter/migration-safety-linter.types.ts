export type MigrationHazardLevel = 'CRITICAL' | 'WARNING' | 'SAFE';

export interface MigrationHazard {
  ruleId: string;
  tableName: string;
  hazardLevel: MigrationHazardLevel;
  description: string;
  recommendation: string;
  sqlSnippet: string;
}

export interface MigrationLintReport {
  migrationName: string;
  passed: boolean;
  hazards: MigrationHazard[];
  lockLevel: 'ACCESS_EXCLUSIVE' | 'SHARE_UPDATE_EXCLUSIVE' | 'ROW_EXCLUSIVE' | 'NONE';
}
