import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { TransactionalOutboxPublisher } from './transactional-outbox-publisher.service.ts';

describe('TransactionalOutboxPublisher [ARCH-CORE-005]', () => {
  test('persists outbox records and publishes CDC events atomically', async () => {
    const outbox = new TransactionalOutboxPublisher();
    outbox.appendEvent('user_10', 'USER_REGISTERED', { email: 'user@example.com' });
    outbox.appendEvent('user_10', 'KYC_VERIFIED', { tier: 'GOLD' });

    assert.equal(outbox.getPendingCount(), 2);

    const published = [];
    const count = await outbox.publishPending(evt => { published.push(evt.eventType); });

    assert.equal(count, 2);
    assert.equal(outbox.getPendingCount(), 0);
    assert.deepEqual(published, ['USER_REGISTERED', 'KYC_VERIFIED']);
  });
});
