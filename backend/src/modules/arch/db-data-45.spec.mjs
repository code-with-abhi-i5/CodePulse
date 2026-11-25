import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PrismaMultiSchemaRouterService } from './db-data-45.service.ts';

describe('PrismaMultiSchemaRouterService (DB-DATA-45)', () => {
  it('correctly qualifies model tables to their dedicated PostgreSQL schemas', () => {
    const router = new PrismaMultiSchemaRouterService();

    assert.strictEqual(router.qualifyTableName('User', 'users'), '"identity"."users"');
    assert.strictEqual(router.qualifyTableName('Battle', 'battles'), '"battles"."battles"');
    assert.strictEqual(router.qualifyTableName('TelemetryEvent', 'events'), '"telemetry"."events"');
  });
});
