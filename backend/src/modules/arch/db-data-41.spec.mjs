import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseBulkInsertPipelineService } from './db-data-41.service.ts';

describe('DatabaseBulkInsertPipelineService (DB-DATA-41)', () => {
  it('splits queued bulk inserts into micro-batches and streams to writer', async () => {
    const pipeline = new DatabaseBulkInsertPipelineService(2);
    pipeline.enqueue(['row1', 'row2', 'row3', 'row4', 'row5']);

    const executedBatches = [];
    const stats = await pipeline.processBatches(async (batch) => {
      executedBatches.push(batch);
      return batch.length;
    });

    assert.strictEqual(stats.totalInserted, 5);
    assert.strictEqual(stats.batchesCount, 3);
    assert.strictEqual(executedBatches[0].length, 2);
    assert.strictEqual(executedBatches[2].length, 1);
  });
});
