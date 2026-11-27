import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { WcagInactivityDialogA11y } from './wcag-inactivity-dialog.service.ts';

describe('WcagInactivityDialogA11y [L2-ERROR-RETRY-OFFLINE-038]', () => {
  const a11y = new WcagInactivityDialogA11y();

  test('provides accessible alertdialog ARIA attributes conforming to WCAG 2.1 AA', () => {
    const props = a11y.getDialogAriaProps();
    assert.equal(props.role, 'alertdialog');
    assert.equal(props.ariaModal, true);
  });

  test('generates accessible countdown text', () => {
    const text = a11y.getCountdownAnnouncement(300);
    assert.ok(text.includes('5 minutes'));
  });
});
