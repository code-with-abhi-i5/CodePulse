import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DarkThemeBookmarkRollbackManager } from './dark-bookmark-rollback.service.ts';

describe('DarkThemeBookmarkRollbackManager [L2-ERROR-RETRY-OFFLINE-029]', () => {
  const mgr = new DarkThemeBookmarkRollbackManager();

  test('returns high-contrast dark theme colors for bookmarked state', () => {
    const active = mgr.getBadgeStyle(true);
    assert.equal(active.bg, '#1E293B');
    assert.equal(active.text, '#38BDF8');

    const inactive = mgr.getBadgeStyle(false);
    assert.equal(inactive.bg, '#0F172A');
  });
});
