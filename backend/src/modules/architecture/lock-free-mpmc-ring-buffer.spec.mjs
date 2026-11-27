import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { LockFreeMPMCRingBuffer } from './lock-free-mpmc-ring-buffer.service.ts';

describe('LockFreeMPMCRingBuffer [ARCH-CORE-006]', () => {
  test('enqueues and dequeues items maintaining FIFO order', () => {
    const ring = new LockFreeMPMCRingBuffer(4);
    assert.equal(ring.enqueue('A'), true);
    assert.equal(ring.enqueue('B'), true);
    assert.equal(ring.size(), 2);

    assert.equal(ring.dequeue(), 'A');
    assert.equal(ring.dequeue(), 'B');
    assert.equal(ring.dequeue(), null);
  });

  test('returns false when capacity is saturated', () => {
    const ring = new LockFreeMPMCRingBuffer(2);
    ring.enqueue(1);
    ring.enqueue(2);
    assert.equal(ring.enqueue(3), false);
  });
});
