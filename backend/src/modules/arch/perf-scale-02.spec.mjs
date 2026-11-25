import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RedisPipeliningBatcherService } from './perf-scale-02.service.ts';

describe('RedisPipeliningBatcherService (PERF-SCALE-02)', () => {
  it('coalesces individual commands and executes batch in single round-trip', () => {
    const batcher = new RedisPipeliningBatcherService(10);
    const id1 = batcher.enqueue('SET', 'user:1', { name: 'Alice' });
    const id2 = batcher.enqueue('GET', 'user:1');

    assert.strictEqual(batcher.getQueueLength(), 2);
    const results = batcher.executePipeline();

    assert.strictEqual(results.length, 2);
    assert.strictEqual(results[0].commandId, id1);
    assert.strictEqual(results[0].data, 'OK');
    assert.strictEqual(results[1].commandId, id2);
    assert.deepStrictEqual(results[1].data, { name: 'Alice' });
    assert.strictEqual(batcher.getQueueLength(), 0);
  });
});
