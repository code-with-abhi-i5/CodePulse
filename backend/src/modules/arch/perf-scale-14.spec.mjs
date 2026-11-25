import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { QueryProjectionOptimizerService } from './perf-scale-14.service.ts';

describe('QueryProjectionOptimizerService (PERF-SCALE-14)', () => {
  it('strips heavy columns from default projections', () => {
    const optimizer = new QueryProjectionOptimizerService();
    const row = {
      id: 'sub-1',
      userId: 'usr-10',
      status: 'PASSED',
      raw_source_code: 'import sys; ... 5000 lines ...',
      compiler_log_blob: 'Compiler stdout...'
    };

    const optimized = optimizer.optimizeProjection(row);
    assert.strictEqual(optimized.id, 'sub-1');
    assert.strictEqual(optimized.status, 'PASSED');
    assert.strictEqual(optimized.raw_source_code, undefined);
    assert.strictEqual(optimized.compiler_log_blob, undefined);
  });

  it('preserves heavy columns when explicitly requested in projection', () => {
    const optimizer = new QueryProjectionOptimizerService();
    const row = { id: 'sub-2', raw_source_code: 'code' };
    const optimized = optimizer.optimizeProjection(row, ['id', 'raw_source_code']);
    assert.strictEqual(optimized.id, 'sub-2');
    assert.strictEqual(optimized.raw_source_code, 'code');
  });
});
