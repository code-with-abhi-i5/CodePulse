import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

class PowChallengeIssuerService {
  constructor(ttlMs = 120000) {
    this.ttlMs = ttlMs;
  }

  issueChallenge(difficultyZeros = 4, now = Date.now()) {
    const challengeId = crypto.randomUUID();
    const seed = crypto.randomBytes(16).toString('hex');
    const difficultyPrefix = '0'.repeat(difficultyZeros);

    return {
      challengeId,
      difficultyPrefix,
      seed,
      expiresAt: now + this.ttlMs
    };
  }

  verifySolution(challenge, nonce, now = Date.now()) {
    if (now > challenge.expiresAt) {
      return false;
    }

    const hash = crypto.createHash('sha256').update(challenge.seed + ':' + nonce).digest('hex');
    return hash.startsWith(challenge.difficultyPrefix);
  }
}

describe('PowChallengeIssuerService', () => {
  const pow = new PowChallengeIssuerService(60000);

  it('issues and validates cryptographic proof-of-work challenges', () => {
    const challenge = pow.issueChallenge(2, 1000); // 2 zeros for fast test execution
    assert.equal(challenge.difficultyPrefix, '00');

    // Solve PoW in test loop
    let nonce = 0;
    while (!pow.verifySolution(challenge, nonce, 2000)) {
      nonce++;
    }

    assert.ok(pow.verifySolution(challenge, nonce, 2000));
  });

  it('rejects expired challenges', () => {
    const challenge = pow.issueChallenge(1, 1000);
    assert.equal(pow.verifySolution(challenge, 0, 700000), false);
  });
});
