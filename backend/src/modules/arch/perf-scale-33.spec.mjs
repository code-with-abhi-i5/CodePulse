import assert from 'node:assert/strict';
import { CircularMetricsBufferService } from './perf-scale-33.service.ts';

const buf = new CircularMetricsBufferService(5);
assert.strictEqual(buf.getCapacity(), 5);

buf.record('latency', 10);
buf.record('latency', 20);
buf.record('latency', 30);

let recent = buf.getRecent();
assert.strictEqual(recent.length, 3);
assert.strictEqual(recent[0].value, 30);

buf.record('latency', 40);
buf.record('latency', 50);
buf.record('latency', 60);

assert.strictEqual(buf.getTotalWrites(), 6);
recent = buf.getRecent();
assert.strictEqual(recent.length, 5);
assert.strictEqual(recent[0].value, 60);

const summary = buf.getSummary('latency');
assert.strictEqual(summary.count, 5);
assert.strictEqual(summary.min, 20);
assert.strictEqual(summary.max, 60);
assert.strictEqual(summary.mean, 40);

buf.clear();
assert.strictEqual(buf.getTotalWrites(), 0);
console.log('Issue #3068 [PERF-SCALE-33] spec passed successfully.');
