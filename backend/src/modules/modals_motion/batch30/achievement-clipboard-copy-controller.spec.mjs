import test from 'node:test';
import assert from 'node:assert/strict';
import { AchievementClipboardCopyController } from './achievement-clipboard-copy-controller.service.ts';

test('AchievementClipboardCopyController [L2-MODAL-A11Y-MOTION-008]', async (t) => {
  const ctrl = new AchievementClipboardCopyController();

  await t.test('formats social share text with title and link', () => {
    const msg = ctrl.formatSharePayload('Bug Hunter', 'https://codepulse.io/achievements/1');
    assert.ok(msg.includes('Bug Hunter'));
    assert.ok(msg.includes('https://codepulse.io/achievements/1'));
  });
});
