import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JwtKeyRotationEngineService } from './sec-auth-02.service.ts';

describe('JwtKeyRotationEngineService (SEC-AUTH-02)', () => {
  it('manages key rotation and dual-key verification across JWKS key lifecycle', () => {
    const engine = new JwtKeyRotationEngineService();
    const now = Date.now();

    engine.registerKey({ kid: 'key-2026-v1', kty: 'oct', use: 'sig', secret: 'sec1', isPrimary: true, expiresAt: now + 3600000 });
    assert.strictEqual(engine.getSigningKey().kid, 'key-2026-v1');

    // Rotate to v2
    engine.registerKey({ kid: 'key-2026-v2', kty: 'oct', use: 'sig', secret: 'sec2', isPrimary: true, expiresAt: now + 7200000 });
    assert.strictEqual(engine.getSigningKey().kid, 'key-2026-v2');

    // Dual-key verification: both v1 and v2 verify
    assert.strictEqual(engine.getVerificationKey('key-2026-v1')?.kid, 'key-2026-v1');
    assert.strictEqual(engine.getVerificationKey('key-2026-v2')?.kid, 'key-2026-v2');

    const publicJwks = engine.getPublicJwks();
    assert.strictEqual(publicJwks.length, 2);
  });
});
