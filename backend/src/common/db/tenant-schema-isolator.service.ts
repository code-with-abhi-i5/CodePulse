import { TenantMigrationResult } from '../../types/db';

export class TenantSchemaIsolatorService {
  public sanitizeSchemaName(organizationId: string): string {
    const cleaned = organizationId.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    return `tenant_${cleaned}`;
  }

  public generateCreateSchemaSql(schemaName: string): string {
    return `CREATE SCHEMA IF NOT EXISTS "${schemaName}";`;
  }

  public generateSearchPathSql(schemaName: string): string {
    return `SET search_path TO "${schemaName}", public;`;
  }

  public executeMigrations(
    organizationId: string,
    migrations: Array<{ id: string; sql: string }>,
    executedTracker: Set<string> = new Set()
  ): TenantMigrationResult {
    const startTime = Date.now();
    const schemaName = this.sanitizeSchemaName(organizationId);
    const newlyExecuted: string[] = [];

    for (const migration of migrations) {
      const trackingKey = `${schemaName}:${migration.id}`;
      if (!executedTracker.has(trackingKey)) {
        // Simulating migration execution within tenant search_path
        executedTracker.add(trackingKey);
        newlyExecuted.push(migration.id);
      }
    }

    return {
      tenantId: organizationId,
      schemaName,
      executedMigrations: newlyExecuted,
      durationMs: Date.now() - startTime,
      success: true
    };
  }
}
