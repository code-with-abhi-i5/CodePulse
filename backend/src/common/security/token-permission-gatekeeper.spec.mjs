import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class TokenPermissionGatekeeperService {
  evaluateAccess(userId, heldScopes, requiredScope) {
    if (heldScopes.includes('*') || heldScopes.includes('admin:*') || heldScopes.includes('admin')) {
      return { granted: true, userId, requiredScope, heldScopes };
    }

    if (heldScopes.includes(requiredScope)) {
      return { granted: true, userId, requiredScope, heldScopes };
    }

    const [reqDomain] = requiredScope.split(':');
    if (heldScopes.includes(reqDomain + ':*')) {
      return { granted: true, userId, requiredScope, heldScopes };
    }

    return {
      granted: false,
      userId,
      requiredScope,
      heldScopes,
      reason: 'User does not hold required scope "' + requiredScope + '"'
    };
  }
}

describe('TokenPermissionGatekeeperService', () => {
  const gatekeeper = new TokenPermissionGatekeeperService();

  it('authorizes exact scope matches', () => {
    const res = gatekeeper.evaluateAccess('u-1', ['read:challenges', 'write:submissions'], 'read:challenges');
    assert.equal(res.granted, true);
  });

  it('authorizes domain wildcard and admin permissions', () => {
    const resDomain = gatekeeper.evaluateAccess('u-2', ['challenges:*'], 'challenges:delete');
    assert.equal(resDomain.granted, true);

    const resAdmin = gatekeeper.evaluateAccess('u-admin', ['admin:*'], 'users:purge');
    assert.equal(resAdmin.granted, true);
  });

  it('denies access when scope is missing', () => {
    const resDeny = gatekeeper.evaluateAccess('u-3', ['read:challenges'], 'write:challenges');
    assert.equal(resDeny.granted, false);
    assert.ok(resDeny.reason.includes('does not hold required scope'));
  });
});
