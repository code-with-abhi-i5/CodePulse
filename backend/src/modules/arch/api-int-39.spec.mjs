import { describe, it } from 'node:test';
import assert from 'node:assert';
import { WebhookFailureAlertingService } from './api-int-39.service.ts';

describe('WebhookFailureAlertingService (API-INT-39)', () => {
  it('triggers developer alerts once consecutive webhook failures reach threshold', () => {
    const alerter = new WebhookFailureAlertingService(3);
    const id = 'wh-123';

    assert.strictEqual(alerter.recordFailure(id).alertTriggered, false);
    assert.strictEqual(alerter.recordFailure(id).alertTriggered, false);
    assert.strictEqual(alerter.recordFailure(id).alertTriggered, true); // Threshold 3 reached

    // Next failure shouldn't re-trigger spam alert
    assert.strictEqual(alerter.recordFailure(id).alertTriggered, false);
  });
});
