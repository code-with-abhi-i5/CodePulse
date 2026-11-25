import { describe, it } from 'node:test';
import assert from 'node:assert';
import { WebhookEventOrderingReconcilerService } from './api-int-24.service.ts';

describe('WebhookEventOrderingReconcilerService (API-INT-24)', () => {
  it('buffers out-of-order events and delivers them in strict sequential order', () => {
    const reconciler = new WebhookEventOrderingReconcilerService();
    const entity = 'user-99';

    // Arrives out of order: seq 2 first
    const r1 = reconciler.processEvent({ entityId: entity, sequenceNumber: 2, data: 'state-2' });
    assert.deepStrictEqual(r1, []);

    // Seq 1 arrives -> both 1 and 2 released
    const r2 = reconciler.processEvent({ entityId: entity, sequenceNumber: 1, data: 'state-1' });
    assert.deepStrictEqual(r2, ['state-1', 'state-2']);
  });
});
