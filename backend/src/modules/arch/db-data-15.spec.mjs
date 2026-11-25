import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SlowQueryDiagnosticLoggerService } from './db-data-15.service.ts';

describe('SlowQueryDiagnosticLoggerService (DB-DATA-15)', () => {
  it('detects slow queries and flags missing indexes from sequential scan execution plans', () => {
    const logger = new SlowQueryDiagnosticLoggerService(200);
    const diagnosis = logger.analyzeAndDiagnose({
      query: 'SELECT * FROM submissions WHERE user_id = $1',
      durationMs: 450,
      plan: { nodeType: 'Seq Scan', totalCost: 1500, hasSeqScan: true }
    });

    assert.strictEqual(diagnosis.isSlow, true);
    assert.ok(diagnosis.recommendation.includes('sequential scan detected'));
  });
});
