import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GraphqlRbacDirectiveService } from './api-int-17.service.ts';

describe('GraphqlRbacDirectiveService (API-INT-17)', () => {
  it('enforces field-level RBAC role requirements across GraphQL schema fields', () => {
    const rbac = new GraphqlRbacDirectiveService();
    rbac.registerFieldRule('User', 'email', ['ADMIN', 'SELF']);
    rbac.registerFieldRule('User', 'publicProfile', []);

    assert.strictEqual(rbac.authorizeFieldAccess('User', 'publicProfile', ['GUEST']), true);
    assert.strictEqual(rbac.authorizeFieldAccess('User', 'email', ['GUEST']), false);
    assert.strictEqual(rbac.authorizeFieldAccess('User', 'email', ['ADMIN']), true);
  });
});
