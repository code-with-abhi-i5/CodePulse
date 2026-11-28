import test from 'node:test';
import assert from 'node:assert/strict';
import { WcagFocusTrapDialog } from './wcag-focus-trap-dialog.service.ts';

test('WcagFocusTrapDialog [L2-MODAL-A11Y-MOTION-031]', async (t) => {
  const dialog = new WcagFocusTrapDialog();

  await t.test('generates WCAG 2.1 AA modal dialog attributes', () => {
    const attrs = dialog.getAccessibleDialogAttrs('my-dialog', 'my-title');
    assert.equal(attrs.role, 'dialog');
    assert.equal(attrs['aria-modal'], 'true');
    assert.equal(attrs['aria-labelledby'], 'my-title');
    assert.equal(attrs.tabIndex, -1);
  });
});
