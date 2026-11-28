import test from 'node:test';
import assert from 'node:assert/strict';
import { ShareableAchievementLinkManager } from './shareable-achievement-link-manager.service.ts';

test('ShareableAchievementLinkManager [L2-MODAL-A11Y-MOTION-058]', async (t) => {
  const mgr = new ShareableAchievementLinkManager();

  await t.test('generates URL encoded shareable link', () => {
    const url = mgr.generateShareLink('grand-master-2026');
    assert.equal(url, 'https://codepulse.io/achievements/grand-master-2026?shared=true');
  });

  await t.test('indicates animated checkmark icon during feedback window', () => {
    const now = Date.now();
    const active = mgr.getCopyState(now);
    assert.equal(active.copied, true);
    assert.equal(active.icon, 'checkmark-animated');

    const expired = mgr.getCopyState(now - 3000);
    assert.equal(expired.copied, false);
    assert.equal(expired.icon, 'copy-outline');
  });
});
