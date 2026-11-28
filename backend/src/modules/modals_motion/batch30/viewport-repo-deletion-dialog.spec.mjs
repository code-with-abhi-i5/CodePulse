import test from 'node:test';
import assert from 'node:assert/strict';
import { ViewportRepoDeletionDialog } from './viewport-repo-deletion-dialog.service.ts';

test('ViewportRepoDeletionDialog [L2-MODAL-A11Y-MOTION-015]', async (t) => {
  const dialog = new ViewportRepoDeletionDialog();

  await t.test('applies iOS zoom-prevention 16px font and full width button on mobile', () => {
    const mobile = dialog.getLayoutConfig(390);
    assert.equal(mobile.inputFontSize, '16px');
    assert.equal(mobile.confirmButtonFullWidth, true);

    const desktop = dialog.getLayoutConfig(1200);
    assert.equal(desktop.inputFontSize, '14px');
    assert.equal(desktop.confirmButtonFullWidth, false);
  });
});
