import assert from 'node:assert/strict';
import { V8JitDeoptWatchdogService } from './perf-scale-41.service.ts';

const watchdog = new V8JitDeoptWatchdogService(2);

const a1 = watchdog.recordDeopt('computeTokenHash', 'soft', 'polymorphic IC');
assert.strictEqual(a1, null);
assert.strictEqual(watchdog.getDeoptCount('computeTokenHash'), 1);

const a2 = watchdog.recordDeopt('computeTokenHash', 'eager', 'wrong map');
assert.ok(a2);
assert.strictEqual(a2.fnName, 'computeTokenHash');
assert.strictEqual(a2.deoptCount, 2);

const hot = watchdog.getHotDeoptimizedFunctions();
assert.strictEqual(hot.length, 1);
assert.strictEqual(hot[0], 'computeTokenHash');

console.log('Issue #3076 [PERF-SCALE-41] spec passed successfully.');
