import assert from 'node:assert/strict';
import { ShardedAtomicCounterService } from './perf-scale-42.service.ts';

const counter = new ShardedAtomicCounterService(4);

counter.increment('views', 1, 'worker-1');
counter.increment('views', 2, 'worker-1');
counter.increment('views', 5, 'worker-2');
counter.increment('views', 10, 'worker-3');

const total = counter.get('views');
assert.strictEqual(total, 18);

const dist = counter.getShardDistribution('views');
assert.strictEqual(dist.length, 4);
assert.strictEqual(dist.reduce((a, b) => a + b, 0), 18);

counter.reset('views');
assert.strictEqual(counter.get('views'), 0);

console.log('Issue #3077 [PERF-SCALE-42] spec passed successfully.');
