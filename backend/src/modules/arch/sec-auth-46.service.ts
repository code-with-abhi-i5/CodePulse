/**
 * Architecture Service: Tenant Role Delegation Manager
 * Subsystem: Enterprise Authentication & Cryptography [SEC-AUTH-46]
 */

export interface RoleDelegationLease {
  id: string;
  tenantId: string;
  granterUserId: string;
  granteeUserId: string;
  role: string;
  permissions: string[];
  expiresAt: number;
  revoked: boolean;
}

export class TenantRoleDelegationManagerService {
  private leases: Map<string, RoleDelegationLease>;

  constructor() {
    this.leases = new Map();
  }

  public createLease(
    tenantId: string,
    granterUserId: string,
    granteeUserId: string,
    role: string,
    permissions: string[],
    durationMs: number
  ): RoleDelegationLease {
    if (granterUserId === granteeUserId) {
      throw new Error('Self-delegation is prohibited');
    }
    const id = `lease_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const lease: RoleDelegationLease = {
      id,
      tenantId,
      granterUserId,
      granteeUserId,
      role,
      permissions,
      expiresAt: Date.now() + durationMs,
      revoked: false
    };
    this.leases.set(id, lease);
    return lease;
  }

  public evaluateDelegatedPermissions(tenantId: string, userId: string): string[] {
    const activePerms = new Set<string>();
    const now = Date.now();

    for (const lease of this.leases.values()) {
      if (
        lease.tenantId === tenantId &&
        lease.granteeUserId === userId &&
        !lease.revoked &&
        now < lease.expiresAt
      ) {
        lease.permissions.forEach(p => activePerms.add(p));
      }
    }

    return Array.from(activePerms);
  }

  public revokeLease(leaseId: string): boolean {
    const lease = this.leases.get(leaseId);
    if (!lease) return false;
    lease.revoked = true;
    return true;
  }
}
