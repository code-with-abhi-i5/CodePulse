import { RbacEvaluationResult } from '../../types/security';

export class HierarchicalRbacEngineService {
  private readonly roleHierarchy = new Map<string, string[]>([
    ['SUPER_ADMIN', ['ADMIN', 'MODERATOR', 'USER']],
    ['ADMIN', ['MODERATOR', 'USER']],
    ['MODERATOR', ['USER']],
    ['USER', []]
  ]);

  private readonly rolePermissions = new Map<string, string[]>([
    ['SUPER_ADMIN', ['system:purge', 'system:configure']],
    ['ADMIN', ['users:ban', 'challenges:create', 'challenges:delete']],
    ['MODERATOR', ['challenges:edit', 'chat:mute']],
    ['USER', ['challenges:solve', 'chat:message']]
  ]);

  public getInheritedRoles(role: string): string[] {
    const roles = new Set<string>([role]);
    const children = this.roleHierarchy.get(role) || [];
    children.forEach(c => {
      roles.add(c);
      this.getInheritedRoles(c).forEach(sub => roles.add(sub));
    });
    return Array.from(roles);
  }

  public evaluatePermission(userRoles: string[], requiredPermission: string): RbacEvaluationResult {
    const allRoles = new Set<string>();
    userRoles.forEach(r => {
      this.getInheritedRoles(r).forEach(inherited => allRoles.add(inherited));
    });

    const evaluatedPermissions: string[] = [];
    allRoles.forEach(role => {
      const perms = this.rolePermissions.get(role) || [];
      evaluatedPermissions.push(...perms);
    });

    const allowed = evaluatedPermissions.includes(requiredPermission);

    return {
      allowed,
      inheritedRoles: Array.from(allRoles),
      evaluatedPermissions,
      denialReason: allowed ? undefined : `Required permission "${requiredPermission}" not granted`
    };
  }
}
