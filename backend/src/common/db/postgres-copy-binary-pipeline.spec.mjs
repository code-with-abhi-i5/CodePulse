import test from 'node:test';
import assert from 'node:assert/strict';

class PostgresCopyBinaryPipelineService {
  executeBulkIngest(rowCount, durationMs) {
    const durationSeconds = Math.max(durationMs / 1000, 0.001);
    return {
      rowsIngested: rowCount,
      durationMs,
      throughputRowsPerSec: Math.round(rowCount / durationSeconds),
      protocol: 'COPY_BINARY'
    };
  }
}

test('PostgresCopyBinaryPipelineService - computes high throughput metrics for binary COPY ingestion', () => {
  const pipeline = new PostgresCopyBinaryPipelineService();
  const res = pipeline.executeBulkIngest(50000, 1000);
  assert.equal(res.rowsIngested, 50000);
  assert.equal(res.throughputRowsPerSec, 50000);
  assert.equal(res.protocol, 'COPY_BINARY');
});
