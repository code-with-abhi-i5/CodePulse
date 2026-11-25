import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SessionFixationGuardService } from './sec-auth-38.service.ts';

describe('SessionFixationGuardService (SEC-AUTH-38)', () => {
  it('rotates session ID upon privilege elevation and invalidates previous session token', () => {
    const guard = new SessionFixationGuardService();
    const oldSession = guard.createSession('user-1', 'USER');

    const newSession = guard.elevatePrivilege(oldSession, 'ADMIN');
    assert.notStrictEqual(newSession, oldSession);

    // Old session is destroyed
    assert.strictEqual(guard.getSession(oldSession), null);

    // New session has elevated role
    const active = guard.getSession(newSession);
    assert.strictEqual(active.role, 'ADMIN');
    assert.strictEqual(active.userId, 'user-1');
  });
});
