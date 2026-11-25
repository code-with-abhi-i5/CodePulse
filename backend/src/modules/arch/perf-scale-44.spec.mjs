import assert from 'node:assert/strict';
import { QueryPipelineBatcherService } from './perf-scale-44.service.ts';

let wireCallCount = 0;
const mockExecutor = async (queries) => {
  wireCallCount++;
  return queries.map(q => ({ query: q.sql, count: 1 }));
};

const batcher = new QueryPipelineBatcherService(mockExecutor, 3, 20);

const p1 = batcher.executeQuery('SELECT 1');
const p2 = batcher.executeQuery('SELECT 2');
const p3 = batcher.executeQuery('SELECT 3');

const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

assert.strictEqual(wireCallCount, 1);
assert.strictEqual(r1.query, 'SELECT 1');
assert.strictEqual(r3.query, 'SELECT 3');

console.log('Issue #3079 [PERF-SCALE-44] spec passed successfully.');
