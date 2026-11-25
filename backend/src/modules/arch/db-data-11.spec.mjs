import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CrossTenantDataLeakagePreventionProxyService } from './db-data-11.service.ts';

describe('CrossTenantDataLeakagePreventionProxyService (DB-DATA-11)', () => {
  it('enforces tenantId in where clause and rejects cross-tenant spoofing', () => {
    const proxy = new CrossTenantDataLeakagePreventionProxyService();

    // Injects tenantId safely
    const isolated = proxy.enforceTenantIsolation({ where: { status: 'ACTIVE' } }, 'tenant-alpha');
    assert.strictEqual(isolated.where.tenantId, 'tenant-alpha');

    // Rejects cross-tenant access attempt
    assert.throws(
      () => proxy.enforceTenantIsolation({ where: { tenantId: 'tenant-beta' } }, 'tenant-alpha'),
      /Security violation: Attempted cross-tenant query/
    );
  });
});
