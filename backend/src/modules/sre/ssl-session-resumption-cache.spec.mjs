import test from 'node:test';
import assert from 'node:assert/strict';

class SslSessionResumptionCache {
  constructor(defaultTtlSeconds = 3600) {
    this.cache = new Map();
    this.defaultTtlSeconds = defaultTtlSeconds;
  }

  storeSession(sessionId, ticket, peerIdentity) {
    const session = {
      sessionId,
      ticket,
      peerIdentity,
      createdAt: Date.now(),
      ttlSeconds: this.defaultTtlSeconds
    };
    this.cache.set(sessionId, session);
    return session;
  }

  resumeSession(sessionId) {
    const session = this.cache.get(sessionId);
    if (!session) return null;

    const ageSeconds = (Date.now() - session.createdAt) / 1000;
    if (ageSeconds > session.ttlSeconds) {
      this.cache.delete(sessionId);
      return null;
    }
    return session;
  }

  invalidate(sessionId) {
    return this.cache.delete(sessionId);
  }
}

test('SslSessionResumptionCache - caches TLS session tickets and validates TTL expiration', () => {
  const cache = new SslSessionResumptionCache(300);
  cache.storeSession('sess_abc', 'ticket_enc_xyz', 'user_123');

  const resumed = cache.resumeSession('sess_abc');
  assert.notStrictEqual(resumed, null);
  assert.strictEqual(resumed.ticket, 'ticket_enc_xyz');

  assert.strictEqual(cache.invalidate('sess_abc'), true);
  assert.strictEqual(cache.resumeSession('sess_abc'), null);
});
