import assert from 'node:assert/strict';
import { StringInternPoolService } from './perf-scale-31.service.ts';

const pool = new StringInternPoolService();

const tag1 = 'algorithms';
const tag2 = ['algorithms'].join('');
assert.strictEqual(tag1 == tag2, true);

const interned1 = pool.intern(tag1);
const interned2 = pool.intern(tag2);

assert.strictEqual(interned1, interned2);
assert.strictEqual(pool.getPoolSize(), 1);
assert.strictEqual(pool.has('algorithms'), true);

const batch = pool.internArray(['algorithms', 'web', 'web', 'system-design']);
assert.strictEqual(batch.length, 4);
assert.strictEqual(pool.getPoolSize(), 3);

const stats = pool.getStats();
assert.strictEqual(stats.totalInternedRequests, 6);
assert.strictEqual(stats.dedupedHits >= 2, true);
assert.ok(stats.estimatedMemorySavedBytes > 0);

pool.clear();
assert.strictEqual(pool.getPoolSize(), 0);
console.log('Issue #3066 [PERF-SCALE-31] spec passed successfully.');
