import { describe, it } from 'node:test';
import assert from 'node:assert';
import { WebhookReplayAttackDetectorService } from './api-int-28.service.ts';

describe('WebhookReplayAttackDetectorService (API-INT-28)', () => {
  it('validates timestamp tolerance and prevents duplicate replay signatures', () => {
    const detector = new WebhookReplayAttackDetectorService(60000); // 1 minute
    const now = Date.now();

    // Valid
    assert.strictEqual(detector.validateFreshness(now - 10000, 'sig-1', now).valid, true);

    // Stale timestamp (2 minutes old)
    assert.strictEqual(detector.validateFreshness(now - 120000, 'sig-2', now).valid, false);

    // Replay attack with same signature
    assert.strictEqual(detector.validateFreshness(now - 5000, 'sig-1', now).valid, false);
  });
});
