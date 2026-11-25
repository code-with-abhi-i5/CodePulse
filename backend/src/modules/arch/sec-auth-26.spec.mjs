import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CrossTenantIdorGuardService } from './sec-auth-26.service.ts';

describe('CrossTenantIdorGuardService (SEC-AUTH-26)', () => {
  it('permits authorized same-tenant entity access and blocks cross-tenant IDOR requests', () => {
    const guard = new CrossTenantIdorGuardService();
    const entity = { id: 'battle-123', tenantId: 'tenant-omega' };

    // Valid same-tenant access
    assert.doesNotThrow(() => guard.assertOwnership(entity, 'tenant-omega'));

    // IDOR violation
    assert.throws(
      () => guard.assertOwnership(entity, 'tenant-attacker'),
      /Forbidden IDOR Attempt/
    );
  });
});
