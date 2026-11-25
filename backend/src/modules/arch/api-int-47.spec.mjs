import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ApiDynamicPayloadLimiterService } from './api-int-47.service.ts';

describe('ApiDynamicPayloadLimiterService (API-INT-47)', () => {
  it('enforces request byte limits based on user account tiers', () => {
    const limiter = new ApiDynamicPayloadLimiterService();

    // 2 MB payload
    const payloadBytes = 2 * 1024 * 1024;
    assert.strictEqual(limiter.isPayloadAllowed('FREE', payloadBytes).allowed, false);
    assert.strictEqual(limiter.isPayloadAllowed('PRO', payloadBytes).allowed, true);
    assert.strictEqual(limiter.isPayloadAllowed('ENTERPRISE', payloadBytes).allowed, true);
  });
});
