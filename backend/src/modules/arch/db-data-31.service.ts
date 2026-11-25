/**
 * Architecture Service: Row-Level Security (RLS) Policy Engine
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-31]
 */

export class DatabaseRlsPolicyEngineService {
  public async executeInTenantContext<T>(
    tenantId: string,
    operation: () => Promise<T>,
    client: { query: (sql: string) => Promise<any> }
  ): Promise<T> {
    if (!tenantId || typeof tenantId !== 'string') {
      throw new Error('Tenant context missing: RLS policy engine requires valid tenantId');
    }

    const sanitizedTenantId = tenantId.replace(/'/g, "''");
    await client.query(`SET LOCAL app.current_tenant = '${sanitizedTenantId}';`);

    try {
      return await operation();
    } finally {
      await client.query('RESET app.current_tenant;');
    }
  }
}
