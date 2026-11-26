import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SreSvc002Service } from './sre-svc-002.service.ts';

describe('SreSvc002Service (INFRA-SRE-002)', () => {
  it('initializes with default configuration', () => {
    const service = new SreSvc002Service();
    const config = service.getConfig();
    assert.strictEqual(config.enabled, true);
    assert.strictEqual(config.maxRetries, 3);
  });

  it('updates configuration dynamically', () => {
    const service = new SreSvc002Service();
    service.updateConfig({ maxRetries: 5, enabled: false });
    const config = service.getConfig();
    assert.strictEqual(config.maxRetries, 5);
    assert.strictEqual(config.enabled, false);
  });

  it('executes operation cycle cleanly', async () => {
    const service = new SreSvc002Service();
    const status = await service.execute();
    assert.strictEqual(status.healthy, true);
    assert.strictEqual(status.operationsProcessed, 1);
    assert.ok(status.lastExecutionTimestamp > 0);
  });
});
