/**
 * Architecture Service: Cross-Tenant Data Leakage Prevention Proxy
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-11]
 */

export class CrossTenantDataLeakagePreventionProxyService {
  public enforceTenantIsolation<T extends { where?: Record<string, any> }>(
    queryArgs: T,
    activeTenantId: string
  ): T {
    if (!activeTenantId || typeof activeTenantId !== 'string') {
      throw new Error('Tenant context missing: Cross-tenant data leakage prevention rejected query');
    }

    const where = queryArgs.where || {};
    if (where.tenantId !== undefined && where.tenantId !== activeTenantId) {
      throw new Error(`Security violation: Attempted cross-tenant query for '${where.tenantId}' from tenant '${activeTenantId}'`);
    }

    return {
      ...queryArgs,
      where: {
        ...where,
        tenantId: activeTenantId
      }
    };
  }
}
