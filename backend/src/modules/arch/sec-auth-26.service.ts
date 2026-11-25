/**
 * Architecture Service: Cross-Tenant IDOR Authorization Guard
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-26]
 */

export interface TenantScopedEntity {
  id: string;
  tenantId: string;
}

export class CrossTenantIdorGuardService {
  public assertOwnership(entity: TenantScopedEntity, activeCallerTenantId: string): void {
    if (!activeCallerTenantId) {
      throw new Error('Unauthorized: Missing tenant context in request authentication token');
    }

    if (entity.tenantId !== activeCallerTenantId) {
      throw new Error(`Forbidden IDOR Attempt: Entity '${entity.id}' belongs to tenant '${entity.tenantId}', caller has tenant '${activeCallerTenantId}'`);
    }
  }
}
