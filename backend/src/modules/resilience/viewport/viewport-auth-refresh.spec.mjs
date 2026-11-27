import test from 'node:test';
import assert from 'node:assert/strict';
import { ViewportAuthRefreshInterceptor } from './viewport-auth-refresh.service.ts';

test('ViewportAuthRefreshInterceptor [L2-ERROR-RETRY-OFFLINE-016]', async (t) => {
  await t.test('returns non-blocking top bar spinner for mobile screens', () => {
    const interceptor = new ViewportAuthRefreshInterceptor();
    const mobile = interceptor.getRefreshLoaderConfig(true);
    assert.equal(mobile.type, 'top-bar-spinner');
    assert.equal(mobile.nonBlocking, true);

    const desktop = interceptor.getRefreshLoaderConfig(false);
    assert.equal(desktop.type, 'modal-toast');
    assert.equal(desktop.nonBlocking, false);
  });
});
