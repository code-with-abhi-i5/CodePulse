import { describe, it } from 'node:test';
import assert from 'node:assert';
import { WebhookAdaptiveConcurrencyPoolService } from './api-int-34.service.ts';

describe('WebhookAdaptiveConcurrencyPoolService (API-INT-34)', () => {
  it('dynamically adapts concurrency based on measured subscriber latency', () => {
    const pool = new WebhookAdaptiveConcurrencyPoolService(5, 1, 10);

    // Fast responses expand pool
    pool.recordLatencySample(50);
    assert.strictEqual(pool.getConcurrency(), 6);

    // High latency contracts pool
    pool.recordLatencySample(1500);
    assert.strictEqual(pool.getConcurrency(), 5);
  });
});
