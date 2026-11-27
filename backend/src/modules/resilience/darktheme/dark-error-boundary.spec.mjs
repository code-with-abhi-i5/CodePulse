import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DarkThemeErrorBoundary } from './dark-error-boundary.service.ts';

describe('DarkThemeErrorBoundary [L2-ERROR-RETRY-OFFLINE-021]', () => {
  const eb = new DarkThemeErrorBoundary();

  test('provides high-contrast dark theme crash container styles', () => {
    const s = eb.getCrashFallbackStyle();
    assert.equal(s.cardBg, '#18181B');
    assert.equal(s.titleColor, '#F87171');
  });
});
