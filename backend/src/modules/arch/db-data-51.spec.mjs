import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseStatementTimeoutAutoEscalatorService } from './db-data-51.service.ts';

describe('DatabaseStatementTimeoutAutoEscalatorService (DB-DATA-51)', () => {
  it('lowers statement timeout dynamically under high database load to avoid cascading brownouts', () => {
    const escalator = new DatabaseStatementTimeoutAutoEscalatorService(10000, 2000);

    // Normal load
    assert.strictEqual(escalator.calculateTimeout(40, 50), 10000);

    // Moderate load (75%)
    assert.strictEqual(escalator.calculateTimeout(75, 60), 5000);

    // Severe load (90%)
    assert.strictEqual(escalator.calculateTimeout(90, 80), 2000);
  });
});
