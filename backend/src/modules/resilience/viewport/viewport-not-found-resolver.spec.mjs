import test from 'node:test';
import assert from 'node:assert/strict';
import { ViewportNotFoundResolver } from './viewport-not-found-resolver.service.ts';

test('ViewportNotFoundResolver [L2-ERROR-RETRY-OFFLINE-014]', async (t) => {
  await t.test('switches to single stack on small screens', () => {
    const resolver = new ViewportNotFoundResolver();
    const mobile = resolver.getAdaptiveLinkLayout(480);
    assert.equal(mobile.columns, 1);
    assert.equal(mobile.maxSuggestedItems, 3);

    const tablet = resolver.getAdaptiveLinkLayout(800);
    assert.equal(tablet.columns, 2);
    assert.equal(tablet.maxSuggestedItems, 6);
  });
});
