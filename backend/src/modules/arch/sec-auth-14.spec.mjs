import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SpiffeSvidAuthenticatorService } from './sec-auth-14.service.ts';

describe('SpiffeSvidAuthenticatorService (SEC-AUTH-14)', () => {
  it('parses and authorizes SPIFFE/SPIRE X.509 SVID identity URIs', () => {
    const auth = new SpiffeSvidAuthenticatorService('codepulse.io');

    const uri = 'spiffe://codepulse.io/ns/prod/sa/battle-engine';
    const parsed = auth.parseSpiffeId(uri);
    assert.strictEqual(parsed.trustDomain, 'codepulse.io');
    assert.strictEqual(parsed.path, '/ns/prod/sa/battle-engine');

    assert.strictEqual(auth.isAuthorizedService(uri, ['battle-engine', 'judging-worker']), true);
    assert.strictEqual(auth.isAuthorizedService(uri, ['billing-service']), false);
    assert.strictEqual(auth.isAuthorizedService('spiffe://foreign-domain.com/service', ['service']), false);
  });
});
