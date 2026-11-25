/**
 * Architecture Service: Hierarchical RBAC Permission Graph Evaluator
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-06]
 */

export class HierarchicalRbacEvaluatorService {
  private roleHierarchy: Map<string, string[]>; // role -> inherited roles
  private rolePermissions: Map<string, Set<string>>; // role -> direct permissions
  private resolutionCache: Map<string, Set<string>>;

  constructor() {
    this.roleHierarchy = new Map();
    this.rolePermissions = new Map();
    this.resolutionCache = new Map();
  }

  public defineRole(role: string, inherits: string[], permissions: string[]): void {
    this.roleHierarchy.set(role, inherits);
    this.rolePermissions.set(role, new Set(permissions));
    this.resolutionCache.clear();
  }

  public getResolvedPermissions(role: string): Set<string> {
    if (this.resolutionCache.has(role)) {
      return this.resolutionCache.get(role)!;
    }

    const resolved = new Set<string>();
    const toVisit = [role];
    const visited = new Set<string>();

    while (toVisit.length > 0) {
      const current = toVisit.pop()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const perms = this.rolePermissions.get(current);
      if (perms) {
        for (const p of perms) resolved.add(p);
      }

      const inherited = this.roleHierarchy.get(current) || [];
      for (const inh of inherited) {
        if (!visited.has(inh)) toVisit.push(inh);
      }
    }

    this.resolutionCache.set(role, resolved);
    return resolved;
  }

  public hasPermission(role: string, permission: string): boolean {
    const all = this.getResolvedPermissions(role);
    if (all.has('*') || all.has(permission)) return true;

    // Check wildcard scope (e.g. "challenge:*" covers "challenge:create")
    const [domain] = permission.split(':');
    if (domain && all.has(`${domain}:*`)) return true;

    return false;
  }
}
