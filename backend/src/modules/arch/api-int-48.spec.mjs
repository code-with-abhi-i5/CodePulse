import { describe, it } from 'node:test';
import assert from 'node:assert';
import { WebhookTestingPlaygroundService } from './api-int-48.service.ts';

describe('WebhookTestingPlaygroundService (API-INT-48)', () => {
  it('dispatches test events to user endpoints and returns execution details', async () => {
    const playground = new WebhookTestingPlaygroundService();
    const result = await playground.fireTestEvent(
      'https://webhook.site/test',
      'challenge.solved',
      { challengeId: 10 },
      async () => 200
    );

    assert.strictEqual(result.delivered, true);
    assert.strictEqual(result.httpStatus, 200);
    assert.strictEqual(result.eventType, 'challenge.solved');
  });
});
