import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DecompressionBombGuardService } from './api-int-16.service.ts';

describe('DecompressionBombGuardService (API-INT-16)', () => {
  it('detects and rejects zip bombs and excessive uncompressed payloads', () => {
    const guard = new DecompressionBombGuardService(1024 * 1024, 50); // 1MB max, 50x expansion ratio

    // Normal payload
    assert.strictEqual(guard.validateExpansion(1000, 5000).allowed, true);

    // Exceeds max ceiling
    assert.strictEqual(guard.validateExpansion(100000, 2 * 1024 * 1024).allowed, false);

    // Abnormal ratio (100 bytes -> 10,000 bytes = 100x ratio > 50x)
    assert.strictEqual(guard.validateExpansion(100, 10000).allowed, false);
  });
});
