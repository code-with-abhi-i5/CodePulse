import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RateLimitBackoffVisualizerService } from './fe-ui-51.service.ts';

describe('RateLimitBackoffVisualizerService (FE-UI-51)', () => {
  it('calculates remaining backoff seconds on 429 response', () => {
    const service = new RateLimitBackoffVisualizerService();
    service.recordRateLimit('/api/battle/submit', 30, 1000);

    const state = service.getBackoffState('/api/battle/submit', 11000);
    assert.strictEqual(state.isBlocked, true);
    assert.strictEqual(state.remainingSeconds, 20);

    const formatted = service.formatCountdown(state.remainingSeconds);
    assert.strictEqual(formatted, '00:20');
  });

  it('unblocks route automatically when countdown expires', () => {
    const service = new RateLimitBackoffVisualizerService();
    service.recordRateLimit('/api/profile', 5, 1000);

    const expiredState = service.getBackoffState('/api/profile', 7000);
    assert.strictEqual(expiredState.isBlocked, false);
    assert.strictEqual(expiredState.remainingSeconds, 0);
  });
});
