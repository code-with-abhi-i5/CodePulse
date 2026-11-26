import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class SessionConcurrencyLimiterService {
  constructor() {
    this.userSessions = new Map();
  }

  registerSession(userId, sessionId, maxSessions = 3) {
    if (!this.userSessions.has(userId)) this.userSessions.set(userId, []);
    const sessions = this.userSessions.get(userId);
    let kickedSessionId;
    if (sessions.length >= maxSessions) {
      kickedSessionId = sessions.shift();
    }
    sessions.push(sessionId);
    return { kickedSessionId };
  }

  getActiveSessions(userId) {
    return this.userSessions.get(userId) || [];
  }

  revokeSession(userId, sessionId) {
    const sessions = this.userSessions.get(userId);
    if (!sessions) return false;
    const idx = sessions.indexOf(sessionId);
    if (idx !== -1) {
      sessions.splice(idx, 1);
      return true;
    }
    return false;
  }
}

describe('SessionConcurrencyLimiterService', () => {
  it('limits concurrent user logins and evicts stale sessions cleanly', () => {
    const service = new SessionConcurrencyLimiterService();
    service.registerSession('usr-5', 'sess-1', 2);
    service.registerSession('usr-5', 'sess-2', 2);
    const overflow = service.registerSession('usr-5', 'sess-3', 2);

    assert.equal(overflow.kickedSessionId, 'sess-1');
    assert.deepEqual(service.getActiveSessions('usr-5'), ['sess-2', 'sess-3']);
  });
});
