import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DarkThemeAuthRefreshInterceptor } from './dark-auth-refresh.service.ts';

describe('DarkThemeAuthRefreshInterceptor [L2-ERROR-RETRY-OFFLINE-026]', () => {
  const inter = new DarkThemeAuthRefreshInterceptor();

  test('returns dark translucent overlay styles for session refresh', () => {
    const s = inter.getRefreshOverlayStyle();
    assert.ok(s.overlayBg.includes('rgba(15, 23, 42'));
    assert.equal(s.spinnerColor, '#38BDF8');
  });
});
