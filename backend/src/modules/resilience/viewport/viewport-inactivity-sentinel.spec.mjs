import test from 'node:test';
import assert from 'node:assert/strict';
import { ViewportInactivitySentinel } from './viewport-inactivity-sentinel.service.ts';

test('ViewportInactivitySentinel [L2-ERROR-RETRY-OFFLINE-018]', async (t) => {
  await t.test('adapts modal to bottom sheet on mobile screens < 640px', () => {
    const sentinel = new ViewportInactivitySentinel();
    const mobile = sentinel.getModalLayout(390);
    assert.equal(mobile.bottomSheet, true);
    assert.equal(mobile.position, 'fixed-bottom');

    const tablet = sentinel.getModalLayout(768);
    assert.equal(tablet.bottomSheet, false);
    assert.equal(tablet.width, '480px');

    const desktop = sentinel.getModalLayout(1280);
    assert.equal(desktop.width, '420px');
  });
});
