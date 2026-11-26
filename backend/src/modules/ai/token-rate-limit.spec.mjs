import assert from 'node:assert/strict';
import test from 'node:test';

class TokenRateLimitService {
  constructor() {
    this.userBuckets = new Map();
  }

  checkAndConsume(userId, tokensRequested, tier = 'FREE') {
    let bucket = this.userBuckets.get(userId);
    if (!bucket) {
      const maxTokens = tier === 'PRO' ? 250000 : 50000;
      bucket = { userId, remainingTokens: maxTokens };
      this.userBuckets.set(userId, bucket);
    }
    if (bucket.remainingTokens >= tokensRequested) {
      bucket.remainingTokens -= tokensRequested;
      return { allowed: true, remaining: bucket.remainingTokens };
    }
    return { allowed: false, remaining: bucket.remainingTokens };
  }
}

test('TokenRateLimitService: tracks token consumption and enforces tier boundaries', () => {
  const limiter = new TokenRateLimitService();
  const c1 = limiter.checkAndConsume('u-1', 40000, 'FREE');
  assert.equal(c1.allowed, true);
  assert.equal(c1.remaining, 10000);

  const c2 = limiter.checkAndConsume('u-1', 20000, 'FREE');
  assert.equal(c2.allowed, false);
  assert.equal(c2.remaining, 10000);
});
