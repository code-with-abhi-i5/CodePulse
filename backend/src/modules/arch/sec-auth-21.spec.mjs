import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CsprngEntropyMonitorService } from './sec-auth-21.service.ts';

describe('CsprngEntropyMonitorService (SEC-AUTH-21)', () => {
  it('samples random bytes and validates sufficient Shannon entropy', () => {
    const monitor = new CsprngEntropyMonitorService();
    const result = monitor.sampleAndVerifyEntropy(64);

    assert.strictEqual(result.isHealthy, true);
    assert.ok(result.shannonEntropy > 3.0);
  });
});
