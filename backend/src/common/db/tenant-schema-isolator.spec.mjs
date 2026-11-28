import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class TenantSchemaIsolatorService {
  sanitizeSchemaName(organizationId) {
    const cleaned = organizationId.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    return 'tenant_' + cleaned;
  }

  generateCreateSchemaSql(schemaName) {
    return 'CREATE SCHEMA IF NOT EXISTS "' + schemaName + '";';
  }

  generateSearchPathSql(schemaName) {
    return 'SET search_path TO "' + schemaName + '", public;';
  }

  executeMigrations(organizationId, migrations, executedTracker = new Set()) {
    const startTime = Date.now();
    const schemaName = this.sanitizeSchemaName(organizationId);
    const newlyExecuted = [];

    for (const migration of migrations) {
      const trackingKey = schemaName + ':' + migration.id;
      if (!executedTracker.has(trackingKey)) {
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

describe('TenantSchemaIsolatorService', () => {
  const isolator = new TenantSchemaIsolatorService();

  it('sanitizes organization IDs into valid postgres schema names', () => {
    assert.equal(isolator.sanitizeSchemaName('org-acme-corp!'), 'tenant_org_acme_corp_');
    assert.equal(isolator.generateCreateSchemaSql('tenant_alpha'), 'CREATE SCHEMA IF NOT EXISTS "tenant_alpha";');
    assert.equal(isolator.generateSearchPathSql('tenant_alpha'), 'SET search_path TO "tenant_alpha", public;');
  });

  it('executes idempotent migrations for tenant isolation', () => {
    const tracker = new Set(['tenant_org1:001_init']);
    const migrations = [
      { id: '001_init', sql: 'CREATE TABLE t1;' },
      { id: '002_add_index', sql: 'CREATE INDEX idx_t1;' }
    ];

    const result = isolator.executeMigrations('org1', migrations, tracker);
    assert.equal(result.success, true);
    assert.deepEqual(result.executedMigrations, ['002_add_index']);
    assert.ok(tracker.has('tenant_org1:002_add_index'));
  });
});
