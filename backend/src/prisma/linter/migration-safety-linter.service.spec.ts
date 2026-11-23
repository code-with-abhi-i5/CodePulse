import { MigrationSafetyLinterService } from './migration-safety-linter.service';

describe('MigrationSafetyLinterService', () => {
  let linter: MigrationSafetyLinterService;

  beforeEach(() => {
    linter = new MigrationSafetyLinterService();
  });

  it('should flag non-concurrent index creation as CRITICAL hazard', () => {
    const sql = 'CREATE INDEX idx_user_email ON users(email);';
    const report = linter.lintSqlMigration('20260101_add_index', sql);

    expect(report.passed).toBe(false);
    expect(report.hazards.length).toBe(1);
    expect(report.hazards[0].ruleId).toBe('NON_CONCURRENT_INDEX');
    expect(report.lockLevel).toBe('ACCESS_EXCLUSIVE');
  });

  it('should pass safe migrations using CREATE INDEX CONCURRENTLY', () => {
    const sql = 'CREATE INDEX CONCURRENTLY idx_user_email ON users(email);';
    const report = linter.lintSqlMigration('20260101_add_safe_index', sql);

    expect(report.passed).toBe(true);
    expect(report.hazards.length).toBe(0);
  });
});
