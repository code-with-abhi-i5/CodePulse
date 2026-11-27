import test from 'node:test';
import assert from 'node:assert/strict';
import { ViewportOfflineBanner } from './viewport-offline-banner.service.ts';

test('ViewportOfflineBanner [L2-ERROR-RETRY-OFFLINE-012]', async (t) => {
  await t.test('calculates safe area insets for notched mobile devices', () => {
    const banner = new ViewportOfflineBanner();
    const notched = banner.getBannerPlacement(844, true);
    assert.equal(notched.top, 'calc(env(safe-area-inset-top) + 8px)');

    const standard = banner.getBannerPlacement(844, false);
    assert.equal(standard.top, '8px');
  });
});
