import { describe, it, expect, beforeEach } from 'vitest';
import { DuckDbWasmService } from '../components/analytics/duckdb-wasm.service';

describe('DuckDbWasmService In-Browser Analytics Engine', () => {
  let duckDb: DuckDbWasmService;

  beforeEach(async () => {
    duckDb = DuckDbWasmService.getInstance();
    await duckDb.init();
  });

  it('initializes in-memory tables and schema', () => {
    const tables = duckDb.getTableNames();
    expect(tables).toContain('commits');
    expect(tables).toContain('battles');
  });

  it('executes analytical query (commits by hour) in under 20ms', async () => {
    const sql = 'SELECT hour_of_day, COUNT(*) AS commit_count FROM commits GROUP BY hour_of_day;';
    const result = await duckDb.executeQuery(sql);

    expect(result.executionTimeMs).toBeLessThan(20);
    expect(result.rows.length).toBe(24);
    expect(result.columns.map((c) => c.name)).toContain('hour_of_day');
    expect(result.columns.map((c) => c.name)).toContain('commit_count');
  });

  it('executes analytical aggregation on file extensions', async () => {
    const sql = 'SELECT file_extension, SUM(lines_added) FROM commits GROUP BY file_extension;';
    const result = await duckDb.executeQuery(sql);

    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.columns.find((c) => c.name === 'file_extension')).toBeDefined();
    expect(result.columns.find((c) => c.name === 'total_additions')?.type).toBe('NUMBER');
  });

  it('supports client-side CSV export of query results', async () => {
    const sql = 'SELECT hour_of_day, commit_count FROM commits GROUP BY hour_of_day;';
    const result = await duckDb.executeQuery(sql);
    const csv = duckDb.exportToCsv(result);

    expect(csv).toContain('hour_of_day,commit_count');
    expect(csv.split('\n').length).toBe(25); // header + 24 rows
  });

  it('allows importing custom datasets into client-side tables', async () => {
    const customData = [
      { repo: 'repo-a', stars: 120, language: 'TypeScript' },
      { repo: 'repo-b', stars: 85, language: 'Rust' },
    ];
    duckDb.importTable('custom_repos', customData);
    expect(duckDb.getTableNames()).toContain('custom_repos');
  });
});

