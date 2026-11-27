import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CircularTerminalRingBuffer } from './circular-terminal-ring-buffer.service.ts';

describe('CircularTerminalRingBuffer [ARCH-CORE-017]', () => {
  test('writes frames and retrieves tail within capacity', () => {
    const ring = new CircularTerminalRingBuffer(16);
    ring.write('HELLO');
    assert.equal(ring.size(), 5);
    assert.equal(ring.readTail(5).toString(), 'HELLO');
  });

  test('wraps around seamlessly overwriting oldest data on overflow', () => {
    const ring = new CircularTerminalRingBuffer(8);
    ring.write('12345678'); // fills to 8
    ring.write('ABCD');     // overwrites 1234, becomes 5678ABCD
    assert.equal(ring.size(), 8);
    assert.equal(ring.readTail(4).toString(), 'ABCD');
    assert.equal(ring.readTail(8).toString(), '5678ABCD');
  });
});
