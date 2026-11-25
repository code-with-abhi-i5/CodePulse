import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TokenCrlBroadcasterService } from './sec-auth-12.service.ts';

describe('TokenCrlBroadcasterService (SEC-AUTH-12)', () => {
  it('instantly revokes tokens and checks revocation state with low-memory hash lookups', () => {
    const crl = new TokenCrlBroadcasterService();
    const jti = 'jwt-unique-id-12345';

    assert.strictEqual(crl.isRevoked(jti), false);

    crl.revokeToken(jti);
    assert.strictEqual(crl.isRevoked(jti), true);
    assert.strictEqual(crl.isRevoked('different-jwt-id'), false);
  });
});
