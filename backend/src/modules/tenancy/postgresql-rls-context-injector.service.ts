import { TenantContext } from '../../types/tenancy';

export class PostgresRlsContextInjector {
  createSessionQuery(ctx: TenantContext): string {
    if (!ctx.tenantId || typeof ctx.tenantId !== 'string') {
      throw new Error('Invalid tenantId in context');
    }
    const sanitizedTenantId = ctx.tenantId.replace(/[^a-zA-Z0-9_-]/g, '');
    const sanitizedOrgId = (ctx.organizationId || '').replace(/[^a-zA-Z0-9_-]/g, '');
    return `SET LOCAL app.current_tenant_id = '${sanitizedTenantId}'; SET LOCAL app.current_org_id = '${sanitizedOrgId}';`;
  }

  wrapQueryWithRls(ctx: TenantContext, sql: string): string {
    const sessionSetup = this.createSessionQuery(ctx);
    return `BEGIN; ${sessionSetup} ${sql.trim()}; COMMIT;`;
  }

  verifyTenantAccess(queryTenantId: string, activeContext: TenantContext): boolean {
    return queryTenantId === activeContext.tenantId;
  }
}
