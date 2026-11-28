import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class AntiReplayNonceValidatorService {
  constructor(nonceTtlMs = 300000) {
    this.nonceTtlMs = nonceTtlMs;
    this.nonceStore = new Map();
  }

  validateAndConsume(nonce, now = Date.now()) {
    for (const [n, expiry] of this.nonceStore.entries()) {
      if (now >= expiry) {
        this.nonceStore.delete(n);
      }
    }

    if (this.nonceStore.has(nonce)) {
      return {
        accepted: false,
        nonce,
        reason: 'Replay detected: Nonce has already been consumed'
      };
    }

    this.nonceStore.set(nonce, now + this.nonceTtlMs);
    return {
      accepted: true,
      nonce
    };
  }
}

describe('AntiReplayNonceValidatorService', () => {
  const validator = new AntiReplayNonceValidatorService(60000);

  it('accepts fresh crypto nonces and rejects duplicate replayed nonces', () => {
    const res1 = validator.validateAndConsume('nonce-xyz-101', 1000);
    assert.equal(res1.accepted, true);

    const resReplay = validator.validateAndConsume('nonce-xyz-101', 2000);
    assert.equal(resReplay.accepted, false);
    assert.ok(resReplay.reason.includes('Replay detected'));
  });

  it('allows reuse after TTL expiration window', () => {
    validator.validateAndConsume('nonce-temp', 1000);
    const resAfterExpiry = validator.validateAndConsume('nonce-temp', 70000);
    assert.equal(resAfterExpiry.accepted, true);
  });
});
