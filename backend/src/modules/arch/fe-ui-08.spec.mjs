import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PredictiveRoutePrefetchCoordinatorService } from './fe-ui-08.service.ts';

describe('PredictiveRoutePrefetchCoordinatorService (FE-UI-08)', () => {
  it('predicts and prefetches likely next bundle routes based on observed transition frequencies', () => {
    const prefetcher = new PredictiveRoutePrefetchCoordinatorService();

    // Record route transitions: /dashboard -> /battles (8 times), /dashboard -> /settings (2 times)
    for (let i = 0; i < 8; i++) prefetcher.recordTransition('/dashboard', '/battles');
    for (let i = 0; i < 2; i++) prefetcher.recordTransition('/dashboard', '/settings');

    const next = prefetcher.predictNextRoutes('/dashboard', 0.5);
    assert.deepStrictEqual(next, ['/battles']);

    const targets = prefetcher.getPrefetchTargets('/dashboard');
    assert.deepStrictEqual(targets, ['/battles']);

    // Second call -> already prefetched
    assert.deepStrictEqual(prefetcher.getPrefetchTargets('/dashboard'), []);
  });
});
