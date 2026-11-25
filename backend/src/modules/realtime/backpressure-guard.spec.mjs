import assert from 'node:assert/strict';
import test from 'node:test';

class BackpressureGuardService {
  constructor() {
    this.clientStates = new Map();
    this.HIGH_WATERMARK_BYTES = 1024 * 1024;
    this.MAX_LAG_MS = 500;
  }

  evaluateBackpressure(socketId, bufferBytes, lagMs) {
    const isPaused = bufferBytes >= this.HIGH_WATERMARK_BYTES || lagMs >= this.MAX_LAG_MS;
    const state = { socketId, bufferedBytes: bufferBytes, lagMs, isPaused };
    this.clientStates.set(socketId, state);
    return state;
  }

  shouldPausePublisher(socketId) {
    const state = this.clientStates.get(socketId);
    return state ? state.isPaused : false;
  }

  drainBuffer(socketId) {
    const state = this.clientStates.get(socketId);
    if (state) {
      state.bufferedBytes = 0;
      state.lagMs = 0;
      state.isPaused = false;
    }
  }
}

test('BackpressureGuardService: pauses publisher when client lag exceeds 500ms or 1MB buffer', () => {
  const guard = new BackpressureGuardService();
  const safe = guard.evaluateBackpressure('sock-1', 50000, 100);
  assert.equal(safe.isPaused, false);

  const lagging = guard.evaluateBackpressure('sock-1', 50000, 550);
  assert.equal(lagging.isPaused, true);
  assert.equal(guard.shouldPausePublisher('sock-1'), true);

  guard.drainBuffer('sock-1');
  assert.equal(guard.shouldPausePublisher('sock-1'), false);
});
