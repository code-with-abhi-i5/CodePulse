import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FrontendNetworkResilienceInterceptorService } from './fe-ui-20.service.ts';

describe('FrontendNetworkResilienceInterceptorService (FE-UI-20)', () => {
  it('buffers failed mutations and manages retry lifecycle upon network reconnect', () => {
    const interceptor = new FrontendNetworkResilienceInterceptorService(2);
    const mut = interceptor.enqueueFailedMutation('/api/submissions/save', 'PUT', { code: 'test' });

    assert.strictEqual(interceptor.getPendingMutations().length, 1);

    // Fail attempt 1 -> still queued
    assert.strictEqual(interceptor.handleReplayFailure(mut.id), true);
    // Fail attempt 2 -> reaches threshold, dropped
    assert.strictEqual(interceptor.handleReplayFailure(mut.id), false);
    assert.strictEqual(interceptor.getPendingMutations().length, 0);
  });
});
