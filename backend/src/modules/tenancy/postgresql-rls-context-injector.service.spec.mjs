import test from 'node:test';
import assert from 'node:assert/strict';

class PostgresRlsContextInjector {
  createSessionQuery(ctx) {
    if (!ctx.tenantId || typeof ctx.tenantId !== 'string') {
      throw new Error('Invalid tenantId in context');
    }
    const sanitizedTenantId = ctx.tenantId.replace(/[^a-zA-Z0-9_-]/g, '');
    const sanitizedOrgId = (ctx.organizationId || '').replace(/[^a-zA-Z0-9_-]/g, '');
    return `SET LOCAL app.current_tenant_id = '${sanitizedTenantId}'; SET LOCAL app.current_org_id = '${sanitizedOrgId}';`;
  }

  wrapQueryWithRls(ctx, sql) {
    const sessionSetup = this.createSessionQuery(ctx);
    return `BEGIN; ${sessionSetup} ${sql.trim()}; COMMIT;`;
  }

  verifyTenantAccess(queryTenantId, activeContext) {
    return queryTenantId === activeContext.tenantId;
  }
}

test('PostgresRlsContextInjector - sets session variables and wraps transaction correctly', () => {
  const injector = new PostgresRlsContextInjector();
  const ctx = { tenantId: 'tenant_abc123', organizationId: 'org_xyz', role: 'admin', isolationLevel: 'strict' };
  const query = injector.wrapQueryWithRls(ctx, 'SELECT * FROM users');
  assert.match(query, /SET LOCAL app.current_tenant_id = 'tenant_abc123'/);
  assert.match(query, /SET LOCAL app.current_org_id = 'org_xyz'/);
  assert.match(query, /SELECT \* FROM users/);

  assert.strictEqual(injector.verifyTenantAccess('tenant_abc123', ctx), true);
  assert.strictEqual(injector.verifyTenantAccess('other_tenant', ctx), false);
});
