import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { PubSubBackpressureThrottleService } from './pubsub-backpressure-throttle.service.ts';

describe('PubSubBackpressureThrottleService [ARCH-CORE-033]', () => {
  test('enqueues frames and drains within watermarks', () => {
    const throttle = new PubSubBackpressureThrottleService(10, 5);
    for (let i = 0; i < 5; i++) {
      throttle.enqueue({
        id: `f_${i}`,
        topic: 'tournament',
        payload: 'state',
        priority: 'MEDIUM',
        timestamp: Date.now()
      });
    }
    assert.equal(throttle.isUnderPressure(), true);
    const batch = throttle.drainBatch(5);
    assert.equal(batch.length, 5);
    assert.equal(throttle.isUnderPressure(), false);
  });

  test('sheds LOW priority frames when high watermark exceeded', () => {
    const throttle = new PubSubBackpressureThrottleService(3, 2);
    // Fill to watermark with MEDIUM
    for (let i = 0; i < 3; i++) {
      throttle.enqueue({ id: `m_${i}`, topic: 't', payload: 'p', priority: 'MEDIUM', timestamp: 0 });
    }

    const lowResult = throttle.enqueue({ id: 'low_1', topic: 't', payload: 'p', priority: 'LOW', timestamp: 0 });
    assert.equal(lowResult, false);
    assert.equal(throttle.getStats().droppedLow, 1);
  });

  test('preserves HIGH priority frame and evicts queued LOW frame if space needed', () => {
    const throttle = new PubSubBackpressureThrottleService(2, 1);
    throttle.enqueue({ id: 'low_queued', topic: 't', payload: 'p', priority: 'LOW', timestamp: 0 });
    throttle.enqueue({ id: 'med_queued', topic: 't', payload: 'p', priority: 'MEDIUM', timestamp: 0 });

    const highResult = throttle.enqueue({ id: 'critical', topic: 't', payload: 'p', priority: 'HIGH', timestamp: 0 });
    assert.equal(highResult, true);
    assert.equal(throttle.getStats().droppedLow, 1);

    const drained = throttle.drainBatch(10);
    assert.ok(drained.some(f => f.id === 'critical'));
    assert.ok(!drained.some(f => f.id === 'low_queued'));
  });
});
