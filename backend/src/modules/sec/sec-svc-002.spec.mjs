import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SecSvc002Service } from './sec-svc-002.service.ts';

describe('SecSvc002Service (SEC-AUTH-002)', () => {
  it('initializes with default configuration', () => {
    const service = new SecSvc002Service();
    const config = service.getConfig();
    assert.strictEqual(config.enabled, true);
    assert.strictEqual(config.maxRetries, 3);
  });

  it('updates configuration dynamically', () => {
    const service = new SecSvc002Service();
    service.updateConfig({ maxRetries: 5, enabled: false });
    const config = service.getConfig();
    assert.strictEqual(config.maxRetries, 5);
    assert.strictEqual(config.enabled, false);
  });

  it('executes operation cycle cleanly', async () => {
    const service = new SecSvc002Service();
    const status = await service.execute();
    assert.strictEqual(status.healthy, true);
    assert.strictEqual(status.operationsProcessed, 1);
    assert.ok(status.lastExecutionTimestamp > 0);
  });
});
