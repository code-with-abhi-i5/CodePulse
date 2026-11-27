import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DarkThemeOfflineBanner } from './dark-offline-banner.service.ts';

describe('DarkThemeOfflineBanner [L2-ERROR-RETRY-OFFLINE-022]', () => {
  const b = new DarkThemeOfflineBanner();

  test('returns high-contrast dark theme banner styles', () => {
    const theme = b.getBannerTheme();
    assert.equal(theme.background, '#7F1D1D');
    assert.equal(theme.text, '#FEF2F2');
  });
});
