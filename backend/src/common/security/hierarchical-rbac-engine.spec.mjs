import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class HierarchicalRbacEngineService {
  constructor() {
    this.roleHierarchy = new Map([
      ['SUPER_ADMIN', ['ADMIN', 'MODERATOR', 'USER']],
      ['ADMIN', ['MODERATOR', 'USER']],
      ['MODERATOR', ['USER']],
      ['USER', []]
    ]);

    this.rolePermissions = new Map([
      ['SUPER_ADMIN', ['system:purge', 'system:configure']],
      ['ADMIN', ['users:ban', 'challenges:create', 'challenges:delete']],
      ['MODERATOR', ['challenges:edit', 'chat:mute']],
      ['USER', ['challenges:solve', 'chat:message']]
    ]);
  }

  getInheritedRoles(role) {
    const roles = new Set([role]);
    const children = this.roleHierarchy.get(role) || [];
    children.forEach(c => {
      roles.add(c);
      this.getInheritedRoles(c).forEach(sub => roles.add(sub));
    });
    return Array.from(roles);
  }

  evaluatePermission(userRoles, requiredPermission) {
    const allRoles = new Set();
    userRoles.forEach(r => {
      this.getInheritedRoles(r).forEach(inherited => allRoles.add(inherited));
    });

    const evaluatedPermissions = [];
    allRoles.forEach(role => {
      const perms = this.rolePermissions.get(role) || [];
      evaluatedPermissions.push(...perms);
    });

    const allowed = evaluatedPermissions.includes(requiredPermission);

    return {
      allowed,
      inheritedRoles: Array.from(allRoles),
      evaluatedPermissions,
      denialReason: allowed ? undefined : 'Required permission "' + requiredPermission + '" not granted'
    };
  }
}

describe('HierarchicalRbacEngineService', () => {
  const rbac = new HierarchicalRbacEngineService();

  it('inherits subordinate permissions down the role hierarchy tree', () => {
    const adminCheck = rbac.evaluatePermission(['ADMIN'], 'chat:mute');
    assert.equal(adminCheck.allowed, true);
    assert.ok(adminCheck.inheritedRoles.includes('MODERATOR'));
    assert.ok(adminCheck.inheritedRoles.includes('USER'));
  });

  it('denies permissions to roles without sufficient privilege', () => {
    const userCheck = rbac.evaluatePermission(['USER'], 'challenges:create');
    assert.equal(userCheck.allowed, false);
    assert.ok(userCheck.denialReason.includes('not granted'));
  });
});
