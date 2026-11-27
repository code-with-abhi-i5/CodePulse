import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { VectorClockCacheInvalidationBus } from './vector-clock-invalidation-bus.service.ts';

describe('VectorClockCacheInvalidationBus [ARCH-CORE-013]', () => {
  const bus = new VectorClockCacheInvalidationBus();

  test('determines causal ordering and detects concurrent conflicts', () => {
    const v1 = { nodeA: 1, nodeB: 0 };
    const v2 = { nodeA: 2, nodeB: 1 };
    assert.equal(bus.compare(v1, v2), 'BEFORE');
    assert.equal(bus.compare(v2, v1), 'AFTER');

    const vConcurrent = { nodeA: 0, nodeB: 2 };
    assert.equal(bus.compare(v1, vConcurrent), 'CONCURRENT');
  });

  test('increments and merges clocks monotonically', () => {
    let clock = { nodeA: 1 };
    clock = bus.increment(clock, 'nodeA');
    assert.equal(clock.nodeA, 2);

    const merged = bus.merge(clock, { nodeA: 1, nodeB: 5 });
    assert.equal(merged.nodeA, 2);
    assert.equal(merged.nodeB, 5);
  });
});
