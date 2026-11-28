import test from 'node:test';
import assert from 'node:assert/strict';
import { DarkAchievementCopyBadge } from './dark-achievement-copy-badge.service.ts';

test('DarkAchievementCopyBadge [L2-MODAL-A11Y-MOTION-028]', async (t) => {
  const badge = new DarkAchievementCopyBadge();

  await t.test('returns high-contrast dark theme colors with > 7:1 contrast ratio', () => {
    const copied = badge.getThemeStyles(true);
    assert.equal(copied.backgroundColor, '#064e3b');
    assert.equal(copied.contrastRatio, '8.4:1');

    const defaultStyle = badge.getThemeStyles(false);
    assert.equal(defaultStyle.backgroundColor, '#1f2937');
  });
});
