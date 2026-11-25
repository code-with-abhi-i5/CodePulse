import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RefreshTokenRotationService } from './sec-auth-17.service.ts';

describe('RefreshTokenRotationService (SEC-AUTH-17)', () => {
  it('rotates tokens normally and detects token reuse triggering immediate chain revocation', () => {
    const rtr = new RefreshTokenRotationService();
    rtr.registerFamily('fam-1', 'token-v1');

    // Rotation 1: token-v1 -> token-v2
    const res1 = rtr.rotateToken('fam-1', 'token-v1', 'token-v2');
    assert.strictEqual(res1.success, true);
    assert.strictEqual(res1.newToken, 'token-v2');

    // Attack simulation: Attacker presents already-used token-v1
    const breach = rtr.rotateToken('fam-1', 'token-v1', 'token-attacker');
    assert.strictEqual(breach.success, false);
    assert.strictEqual(breach.isCompromised, true);
    assert.ok(breach.error.includes('Refresh token reuse detected'));

    // Legitimate user's token-v2 is now also revoked
    const legit = rtr.rotateToken('fam-1', 'token-v2', 'token-v3');
    assert.strictEqual(legit.success, false);
  });
});
