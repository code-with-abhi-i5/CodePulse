import test from 'node:test';
import assert from 'node:assert/strict';
import { ViewportAchievementShareDialog } from './viewport-achievement-share-dialog.service.ts';

test('ViewportAchievementShareDialog [L2-MODAL-A11Y-MOTION-018]', async (t) => {
  const dialog = new ViewportAchievementShareDialog();

  await t.test('adapts layout mode and native share button on mobile viewports', () => {
    const mobile = dialog.getLayout(375);
    assert.equal(mobile.mode, 'bottom-sheet');
    assert.equal(mobile.showNativeShareButton, true);

    const desktop = dialog.getLayout(1200);
    assert.equal(desktop.mode, 'center-modal');
    assert.equal(desktop.showNativeShareButton, false);
  });
});
