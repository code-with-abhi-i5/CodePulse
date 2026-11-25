import test from 'node:test';
import assert from 'node:assert/strict';

class SamlSsoGateway {
  constructor() {
    this.existingUsers = new Map();
  }

  processAssertion(assertion, tenantId) {
    if (!assertion.email || !assertion.nameId) {
      throw new Error('Invalid SAML Assertion: missing identity attributes');
    }
    const key = `${tenantId}:${assertion.email.toLowerCase()}`;
    const existing = this.existingUsers.get(key);
    if (existing) {
      return {
        ...existing,
        isNew: false
      };
    }

    const role = assertion.groups && assertion.groups.includes('Admins') ? 'admin' : 'member';
    const newUser = {
      userId: `usr_${Math.random().toString(36).substring(2, 10)}`,
      email: assertion.email.toLowerCase(),
      name: `${assertion.firstName} ${assertion.lastName}`.trim(),
      tenantId,
      role,
      isNew: true
    };
    this.existingUsers.set(key, newUser);
    return newUser;
  }
}

test('SamlSsoGateway - provisions JIT user from SAML assertion attributes', () => {
  const sso = new SamlSsoGateway();
  const assertion = {
    issuer: 'https://okta.com/app/123',
    nameId: 'alice@enterprise.com',
    email: 'alice@enterprise.com',
    firstName: 'Alice',
    lastName: 'Smith',
    groups: ['Engineering', 'Admins'],
    sessionIndex: 'sess_1'
  };
  const u1 = sso.processAssertion(assertion, 'tenant_x');
  assert.strictEqual(u1.isNew, true);
  assert.strictEqual(u1.role, 'admin');

  const u2 = sso.processAssertion(assertion, 'tenant_x');
  assert.strictEqual(u2.isNew, false);
});
