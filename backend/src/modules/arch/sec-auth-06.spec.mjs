import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HierarchicalRbacEvaluatorService } from './sec-auth-06.service.ts';

describe('HierarchicalRbacEvaluatorService (SEC-AUTH-06)', () => {
  it('resolves inherited permissions and wildcard permissions correctly', () => {
    const rbac = new HierarchicalRbacEvaluatorService();

    rbac.defineRole('user', [], ['challenge:read', 'battle:join']);
    rbac.defineRole('moderator', ['user'], ['challenge:*']);
    rbac.defineRole('admin', ['moderator'], ['*']);

    assert.strictEqual(rbac.hasPermission('user', 'challenge:read'), true);
    assert.strictEqual(rbac.hasPermission('user', 'challenge:create'), false);

    // Moderator inherits user perms and has challenge:*
    assert.strictEqual(rbac.hasPermission('moderator', 'challenge:create'), true);
    assert.strictEqual(rbac.hasPermission('moderator', 'battle:join'), true);

    // Admin has super wildcard *
    assert.strictEqual(rbac.hasPermission('admin', 'system:destroy'), true);
  });
});
