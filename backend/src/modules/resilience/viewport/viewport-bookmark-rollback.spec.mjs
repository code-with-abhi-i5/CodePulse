import test from 'node:test';
import assert from 'node:assert/strict';
import { ViewportBookmarkRollbackManager } from './viewport-bookmark-rollback.service.ts';

test('ViewportBookmarkRollbackManager [L2-ERROR-RETRY-OFFLINE-019]', async (t) => {
  await t.test('provides minimum 44px touch targets on mobile viewports', () => {
    const mgr = new ViewportBookmarkRollbackManager();
    const mobile = mgr.computeTouchFriendlyStyles(true);
    assert.equal(mobile.minTouchTarget, '44px');
    assert.equal(mobile.touchAction, 'manipulation');

    const desktop = mgr.computeTouchFriendlyStyles(false);
    assert.equal(desktop.padding, '8px 12px');
  });
});
