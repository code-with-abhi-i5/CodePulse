import { TenantRoutingResult } from '../../types/db';

export class TenantConnectionMultiplexerService {
  private dedicatedTenants: Set<string> = new Set(['enterprise-corp', 'vip-customer']);

  routeTenant(tenantId: string): TenantRoutingResult {
    const isDedicated = this.dedicatedTenants.has(tenantId);
    const poolName = isDedicated ? 'pool:tenant:' + tenantId : 'pool:shared:default';

    return {
      tenantId,
      connectionPoolName: poolName,
      isDedicated,
      activeConnections: isDedicated ? 5 : 20
    };
  }
}
