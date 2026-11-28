import { TenantQueryValidation } from '../../types/security';

export class TenantLeakageFirewallService {
  public validateQuery(query: { model: string; action: string; args: any }, expectedTenantId: string): TenantQueryValidation {
    const where = query.args?.where;

    if (!where) {
      return {
        isSafe: false,
        violation: `Query on model ${query.model} lacks a WHERE clause containing tenantId`
      };
    }

    if (where.tenantId !== expectedTenantId) {
      return {
        isSafe: false,
        violation: `Tenant boundary violation: expected tenantId "${expectedTenantId}", found "${where.tenantId || 'NONE'}"`
      };
    }

    return {
      isSafe: true,
      tenantId: expectedTenantId
    };
  }
}
