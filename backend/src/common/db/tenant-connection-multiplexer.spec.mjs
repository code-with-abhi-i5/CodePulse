import test from 'node:test';
import assert from 'node:assert/strict';

class TenantConnectionMultiplexerService {
  constructor() {
    this.dedicatedTenants = new Set(['enterprise-corp']);
  }
  routeTenant(tenantId) {
    const isDedicated = this.dedicatedTenants.has(tenantId);
    return {
      tenantId,
      connectionPoolName: isDedicated ? 'pool:tenant:' + tenantId : 'pool:shared:default',
      isDedicated,
      activeConnections: isDedicated ? 5 : 20
    };
  }
}

test('TenantConnectionMultiplexerService - routes dedicated enterprise tenants to isolated pools', () => {
  const service = new TenantConnectionMultiplexerService();
  const std = service.routeTenant('free-tier-user');
  assert.equal(std.isDedicated, false);
  assert.equal(std.connectionPoolName, 'pool:shared:default');

  const ent = service.routeTenant('enterprise-corp');
  assert.equal(ent.isDedicated, true);
  assert.equal(ent.connectionPoolName, 'pool:tenant:enterprise-corp');
});
