import test from 'node:test';
import assert from 'node:assert/strict';
import { FloatingOfflineBannerManager } from './floating-offline-banner-manager.service.ts';

test('FloatingOfflineBannerManager [L2-ERROR-RETRY-OFFLINE-002]', async (t) => {
  const mgr = new FloatingOfflineBannerManager();

  await t.test('initializes in online hidden state', () => {
    const state = mgr.getBannerState();
    assert.equal(state.visible, false);
    assert.equal(state.severity, 'success');
  });

  await t.test('shows warning banner with queued actions when offline', () => {
    mgr.setOnlineStatus(false);
    mgr.incrementPendingSync();
    mgr.incrementPendingSync();
    const state = mgr.getBannerState();
    assert.equal(state.visible, true);
    assert.equal(state.severity, 'warning');
    assert.equal(state.queuedOperations, 2);
    assert.ok(state.message.includes('2 changes queued'));
  });

  await t.test('clears queued operations on reconnect', () => {
    mgr.setOnlineStatus(true);
    mgr.clearPendingSync();
    const state = mgr.getBannerState();
    assert.equal(state.visible, false);
    assert.equal(state.queuedOperations, 0);
  });
});
