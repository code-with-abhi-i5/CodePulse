import { SqlTaintAnalyzerService } from './sql-taint-analyzer.service';

describe('SqlTaintAnalyzerService', () => {
  let service: SqlTaintAnalyzerService;

  beforeEach(() => {
    service = new SqlTaintAnalyzerService();
  });

  it('detects common SQL injection constructs in untrusted parameters', () => {
    expect(service.detectSqlInjection("admin' OR '1'='1")).toBe(true);
    expect(service.detectSqlInjection("1; DROP TABLE users--")).toBe(true);
    expect(service.detectSqlInjection("valid_username_42")).toBe(false);
  });
});
