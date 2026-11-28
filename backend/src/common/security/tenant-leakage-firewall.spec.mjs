import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class TenantLeakageFirewallService {
  validateQuery(query, expectedTenantId) {
    const where = query.args?.where;

    if (!where) {
      return {
        isSafe: false,
        violation: 'Query on model ' + query.model + ' lacks a WHERE clause containing tenantId'
      };
    }

    if (where.tenantId !== expectedTenantId) {
      return {
        isSafe: false,
        violation: 'Tenant boundary violation: expected tenantId "' + expectedTenantId + '", found "' + (where.tenantId || 'NONE') + '"'
      };
    }

    return {
      isSafe: true,
      tenantId: expectedTenantId
    };
  }
}

describe('TenantLeakageFirewallService', () => {
  const firewall = new TenantLeakageFirewallService();

  it('approves tenant-scoped queries with matching tenantId', () => {
    const query = {
      model: 'Tournament',
      action: 'findMany',
      args: { where: { tenantId: 'tenant-acme', status: 'ACTIVE' } }
    };

    const res = firewall.validateQuery(query, 'tenant-acme');
    assert.equal(res.isSafe, true);
    assert.equal(res.tenantId, 'tenant-acme');
  });

  it('intercepts cross-tenant leaks or missing tenantId filters', () => {
    const queryNoTenant = {
      model: 'Tournament',
      action: 'findMany',
      args: { where: { status: 'ACTIVE' } }
    };

    const resNoTenant = firewall.validateQuery(queryNoTenant, 'tenant-acme');
    assert.equal(resNoTenant.isSafe, false);
    assert.ok(resNoTenant.violation.includes('Tenant boundary violation'));

    const queryNoWhere = {
      model: 'Tournament',
      action: 'findMany',
      args: {}
    };
    const resNoWhere = firewall.validateQuery(queryNoWhere, 'tenant-acme');
    assert.equal(resNoWhere.isSafe, false);
    assert.ok(resNoWhere.violation.includes('lacks a WHERE clause'));
  });
});
