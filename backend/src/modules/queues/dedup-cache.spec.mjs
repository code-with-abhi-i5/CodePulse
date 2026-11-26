import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

class DedupCacheService {
  constructor() {
    this.cache = new Map();
    this.duplicateDetections = 0;
  }

  generateSignature(payload) {
    const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHash('sha256').update(str).digest('hex').slice(0, 16);
  }

  isDuplicate(signature, ttlMs = 86400000) {
    const now = Date.now();
    const exp = this.cache.get(signature);
    if (exp && exp > now) {
      this.duplicateDetections++;
      return true;
    }
    this.cache.set(signature, now + ttlMs);
    return false;
  }

  evictExpired() {
    const now = Date.now();
    let evicted = 0;
    for (const [sig, exp] of this.cache.entries()) {
      if (exp <= now) {
        this.cache.delete(sig);
        evicted++;
      }
    }
    return evicted;
  }

  getStats() {
    return {
      totalEntries: this.cache.size,
      duplicateDetections: this.duplicateDetections,
    };
  }
}

describe('DedupCacheService', () => {
  it('deduplicates identical message payloads over sliding TTL windows', () => {
    const service = new DedupCacheService();
    const sig1 = service.generateSignature({ task: 'compile', matchId: 100 });
    const sig2 = service.generateSignature({ task: 'compile', matchId: 100 });
    assert.equal(sig1, sig2);

    assert.equal(service.isDuplicate(sig1), false);
    assert.equal(service.isDuplicate(sig1), true);
    assert.equal(service.getStats().duplicateDetections, 1);
  });
});
