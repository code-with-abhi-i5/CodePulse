import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TenantRoleDelegationManagerService } from './sec-auth-46.service.ts';

describe('TenantRoleDelegationManagerService (SEC-AUTH-46)', () => {
  it('manages time-bounded role delegation leases and evaluates effective permissions', () => {
    const manager = new TenantRoleDelegationManagerService();
    const lease = manager.createLease(
      'tenant-alpha',
      'user-admin',
      'user-engineer',
      'SupportAdmin',
      ['challenges:read', 'challenges:reset_submission'],
      60000
    );

    assert.ok(lease.id);
    const perms = manager.evaluateDelegatedPermissions('tenant-alpha', 'user-engineer');
    assert.deepStrictEqual(perms.sort(), ['challenges:read', 'challenges:reset_submission'].sort());

    // Revocation check
    manager.revokeLease(lease.id);
    const permsAfterRevoke = manager.evaluateDelegatedPermissions('tenant-alpha', 'user-engineer');
    assert.deepStrictEqual(permsAfterRevoke, []);
  });

  it('rejects self-delegation attempts', () => {
    const manager = new TenantRoleDelegationManagerService();
    assert.throws(() => {
      manager.createLease('tenant-alpha', 'user-1', 'user-1', 'Admin', ['*'], 5000);
    }, /Self-delegation is prohibited/);
  });
});
