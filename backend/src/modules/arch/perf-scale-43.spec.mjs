import assert from 'node:assert/strict';
import { TaskQueueBackpressureRegulatorService, BackpressureState } from './perf-scale-43.service.ts';

const regulator = new TaskQueueBackpressureRegulatorService({
  lowWatermark: 2,
  throttleWatermark: 4,
  highWatermark: 6
});

assert.strictEqual(regulator.getState(), BackpressureState.NORMAL);
assert.strictEqual(regulator.shouldAdmit(), true);

regulator.recordEnqueued();
regulator.recordEnqueued();
regulator.recordEnqueued();
regulator.recordEnqueued();
assert.strictEqual(regulator.getState(), BackpressureState.THROTTLED);
assert.strictEqual(regulator.shouldAdmit(), true);

regulator.recordEnqueued();
regulator.recordEnqueued();
assert.strictEqual(regulator.getState(), BackpressureState.PAUSED);
assert.strictEqual(regulator.shouldAdmit(), false);

regulator.recordDequeued();
regulator.recordDequeued();
regulator.recordDequeued();
regulator.recordDequeued();
assert.strictEqual(regulator.getState(), BackpressureState.NORMAL);
assert.strictEqual(regulator.shouldAdmit(), true);

console.log('Issue #3078 [PERF-SCALE-43] spec passed successfully.');
