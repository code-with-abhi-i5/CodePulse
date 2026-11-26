import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SreSvc010Service } from './sre-svc-010.service.ts';

describe('SreSvc010Service (INFRA-SRE-010)', () => {
  it('initializes with default configuration', () => {
    const service = new SreSvc010Service();
    const config = service.getConfig();
    assert.strictEqual(config.enabled, true);
    assert.strictEqual(config.maxRetries, 3);
  });

  it('updates configuration dynamically', () => {
    const service = new SreSvc010Service();
    service.updateConfig({ maxRetries: 5, enabled: false });
    const config = service.getConfig();
    assert.strictEqual(config.maxRetries, 5);
    assert.strictEqual(config.enabled, false);
  });

  it('executes operation cycle cleanly', async () => {
    const service = new SreSvc010Service();
    const status = await service.execute();
    assert.strictEqual(status.healthy, true);
    assert.strictEqual(status.operationsProcessed, 1);
    assert.ok(status.lastExecutionTimestamp > 0);
  });
});
