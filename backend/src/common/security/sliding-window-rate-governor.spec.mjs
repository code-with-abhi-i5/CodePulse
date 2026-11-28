import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class SlidingWindowRateGovernorService {
  constructor(maxRequestsPerWindow = 100, windowSizeMs = 60000) {
    this.maxRequestsPerWindow = maxRequestsPerWindow;
    this.windowSizeMs = windowSizeMs;
    this.clientLog = new Map();
  }

  recordRequest(clientId, now = Date.now()) {
    const timestamps = (this.clientLog.get(clientId) || []).filter(t => now - t <= this.windowSizeMs);

    if (timestamps.length >= this.maxRequestsPerWindow) {
      const oldestInWindow = timestamps[0];
      const retryAfterSeconds = Math.ceil((this.windowSizeMs - (now - oldestInWindow)) / 1000);
      return {
        allowed: false,
        tokensRemaining: 0,
        retryAfterSeconds: Math.max(1, retryAfterSeconds),
        currentBurst: timestamps.length
      };
    }

    timestamps.push(now);
    this.clientLog.set(clientId, timestamps);

    return {
      allowed: true,
      tokensRemaining: this.maxRequestsPerWindow - timestamps.length,
      retryAfterSeconds: 0,
      currentBurst: timestamps.length
    };
  }
}

describe('SlidingWindowRateGovernorService', () => {
  const governor = new SlidingWindowRateGovernorService(3, 10000);

  it('allows requests within capacity and tracks tokens remaining', () => {
    const r1 = governor.recordRequest('ip-1', 1000);
    assert.equal(r1.allowed, true);
    assert.equal(r1.tokensRemaining, 2);

    governor.recordRequest('ip-1', 2000);
    const r3 = governor.recordRequest('ip-1', 3000);
    assert.equal(r3.allowed, true);
    assert.equal(r3.tokensRemaining, 0);

    const rDenied = governor.recordRequest('ip-1', 4000);
    assert.equal(rDenied.allowed, false);
    assert.ok(rDenied.retryAfterSeconds > 0);
  });

  it('slides window forward to replenish capacity after expiration', () => {
    const rReplenished = governor.recordRequest('ip-1', 12000);
    assert.equal(rReplenished.allowed, true);
  });
});
