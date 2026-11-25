import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GraphqlSubscriptionStreamService } from './api-int-14.service.ts';

describe('GraphqlSubscriptionStreamService (API-INT-14)', () => {
  it('manages topic subscriptions and publishes realtime stream updates', () => {
    const engine = new GraphqlSubscriptionStreamService();
    const received = [];

    const unsubscribe = engine.subscribe('match:123', event => {
      received.push(event);
    });

    const activeCount = engine.publish('match:123', { score: 100, status: 'RUNNING' });
    assert.strictEqual(activeCount, 1);
    assert.strictEqual(received.length, 1);
    assert.strictEqual(received[0].payload.score, 100);

    unsubscribe();
    const afterCount = engine.publish('match:123', { score: 200 });
    assert.strictEqual(afterCount, 0);
  });
});
