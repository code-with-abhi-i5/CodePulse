import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ThreadPoolAutoscalerService } from './perf-scale-11.service.ts';

describe('ThreadPoolAutoscalerService (PERF-SCALE-11)', () => {
  it('scales up worker count when event loop lag is healthy', () => {
    const scaler = new ThreadPoolAutoscalerService(2, 8, 4);
    const count = scaler.adjustPool(5); // low lag
    assert.strictEqual(count, 5);
    assert.strictEqual(scaler.getStats().lastScalingAction, 'UP');
  });

  it('scales down worker count when event loop lag exceeds 50ms', () => {
    const scaler = new ThreadPoolAutoscalerService(2, 8, 4);
    const count = scaler.adjustPool(65); // high lag
    assert.strictEqual(count, 3);
    assert.strictEqual(scaler.getStats().lastScalingAction, 'DOWN');
  });
});
