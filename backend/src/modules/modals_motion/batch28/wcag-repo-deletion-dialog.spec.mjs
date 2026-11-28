import test from 'node:test';
import assert from 'node:assert/strict';
import { WcagRepoDeletionDialog } from './wcag-repo-deletion-dialog.service.ts';

test('WcagRepoDeletionDialog [L2-MODAL-A11Y-MOTION-035]', async (t) => {
  const dialog = new WcagRepoDeletionDialog();

  await t.test('sets accessible alertdialog ARIA attributes for destructive action', () => {
    const attrs = dialog.getAriaDialogAttributes('my-awesome-repo');
    assert.equal(attrs.role, 'alertdialog');
    assert.equal(attrs['aria-modal'], 'true');
    assert.ok(attrs.confirmLabel.includes('my-awesome-repo'));
  });
});
