import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TableVacuumAnalyzeSchedulerService } from './db-data-35.service.ts';

describe('TableVacuumAnalyzeSchedulerService (DB-DATA-35)', () => {
  it('identifies tables exceeding dead-tuple ratio and schedules VACUUM ANALYZE', () => {
    const scheduler = new TableVacuumAnalyzeSchedulerService(0.15);
    const tables = [
      { tableName: 'battles', liveTuples: 800, deadTuples: 200 }, // 20% dead
      { tableName: 'users', liveTuples: 1000, deadTuples: 50 }     // 4.7% dead
    ];

    const results = scheduler.evaluateTables(tables);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].tableName, 'battles');
    assert.strictEqual(results[0].recommendedDdl, 'VACUUM (ANALYZE) battles;');
  });
});
