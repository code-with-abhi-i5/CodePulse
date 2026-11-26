import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SreSvc022Service } from './sre-svc-022.service.ts';

describe('SreSvc022Service (INFRA-SRE-022)', () => {
  it('initializes with default configuration', () => {
    const service = new SreSvc022Service();
    const config = service.getConfig();
    assert.strictEqual(config.enabled, true);
    assert.strictEqual(config.maxRetries, 3);
  });

  it('updates configuration dynamically', () => {
    const service = new SreSvc022Service();
    service.updateConfig({ maxRetries: 5, enabled: false });
    const config = service.getConfig();
    assert.strictEqual(config.maxRetries, 5);
    assert.strictEqual(config.enabled, false);
  });

  it('executes operation cycle cleanly', async () => {
    const service = new SreSvc022Service();
    const status = await service.execute();
    assert.strictEqual(status.healthy, true);
    assert.strictEqual(status.operationsProcessed, 1);
    assert.ok(status.lastExecutionTimestamp > 0);
  });
});
