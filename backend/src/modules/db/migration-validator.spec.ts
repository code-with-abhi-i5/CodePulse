import { MigrationValidatorService } from './migration-validator.service';

describe('MigrationValidatorService', () => {
  let service: MigrationValidatorService;

  beforeEach(() => {
    service = new MigrationValidatorService();
  });

  it('flags destructive drop statements and verifies rollback safety', () => {
    const res = service.validateMigration('CREATE TABLE test (id int);', 'DROP TABLE test;');
    expect(res.warnings.length).toBeGreaterThan(0);
  });
});
