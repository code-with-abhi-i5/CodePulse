import assert from 'node:assert/strict';
import { DynamicBufferPoolRecyclerService } from './perf-scale-45.service.ts';

const recycler = new DynamicBufferPoolRecyclerService([1024, 16384], 5);

const b1 = recycler.acquire(500);
assert.strictEqual(b1.length, 1024);

const released = recycler.release(b1);
assert.strictEqual(released, true);

const b2 = recycler.acquire(500);
assert.strictEqual(b2, b1);

const stats = recycler.getStats();
assert.strictEqual(stats.totalAllocations, 2);
assert.strictEqual(stats.recycledHits, 1);

console.log('Issue #3080 [PERF-SCALE-45] spec passed successfully.');
