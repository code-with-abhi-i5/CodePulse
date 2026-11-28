import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

class PwnedPasswordDefenderService {
  constructor() {
    this.compromisedHashes = new Set();
  }

  registerKnownBreachedHashes(fullSha1Hashes) {
    fullSha1Hashes.forEach(h => this.compromisedHashes.add(h.toUpperCase()));
  }

  checkPassword(plaintextPassword) {
    const sha1 = crypto.createHash('sha1').update(plaintextPassword).digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const isPwned = this.compromisedHashes.has(sha1);

    return {
      isPwned,
      prefix,
      hashCount: isPwned ? 1 : 0
    };
  }
}

describe('PwnedPasswordDefenderService', () => {
  const defender = new PwnedPasswordDefenderService();
  // SHA-1 for "password123": CBFDAC6008F9CAB4083784CBD1874F76618D2A97
  defender.registerKnownBreachedHashes(['CBFDAC6008F9CAB4083784CBD1874F76618D2A97']);

  it('detects compromised passwords using k-Anonymity hash matching', () => {
    const res = defender.checkPassword('password123');
    assert.equal(res.isPwned, true);
    assert.equal(res.prefix, 'CBFDA');
    assert.equal(res.hashCount, 1);
  });

  it('approves unique uncompromised strong passwords', () => {
    const res = defender.checkPassword('Tr0ub4dor&3_Unique_Complex!');
    assert.equal(res.isPwned, false);
    assert.equal(res.hashCount, 0);
  });
});
