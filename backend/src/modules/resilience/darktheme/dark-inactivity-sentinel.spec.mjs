import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DarkThemeInactivitySentinel } from './dark-inactivity-sentinel.service.ts';

describe('DarkThemeInactivitySentinel [L2-ERROR-RETRY-OFFLINE-028]', () => {
  const sentinel = new DarkThemeInactivitySentinel();

  test('provides high-contrast warning accent in dark theme', () => {
    const theme = sentinel.getDialogTheme();
    assert.equal(theme.modalBg, '#0F172A');
    assert.equal(theme.warningAccent, '#F59E0B');
  });
});
