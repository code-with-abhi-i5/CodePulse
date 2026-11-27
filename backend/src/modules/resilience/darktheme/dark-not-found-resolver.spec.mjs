import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DarkThemeNotFoundResolver } from './dark-not-found-resolver.service.ts';

describe('DarkThemeNotFoundResolver [L2-ERROR-RETRY-OFFLINE-024]', () => {
  const res = new DarkThemeNotFoundResolver();

  test('provides accessible high-contrast dark card styles for suggested links', () => {
    const theme = res.getCardTheme();
    assert.equal(theme.cardBg, '#1E293B');
    assert.equal(theme.text, '#F8FAFC');
  });
});
