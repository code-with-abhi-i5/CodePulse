import test from 'node:test';
import assert from 'node:assert/strict';
import { WcagBottomSheetAnnouncer } from './wcag-bottom-sheet-announcer.service.ts';

test('WcagBottomSheetAnnouncer [L2-MODAL-A11Y-MOTION-039]', async (t) => {
  const announcer = new WcagBottomSheetAnnouncer();

  await t.test('announces modal drawer state changes to screen readers', () => {
    const opened = announcer.getAnnounceMessage('opened');
    assert.ok(opened.message.includes('Bottom drawer opened'));
    assert.equal(opened.ariaLive, 'polite');

    const closed = announcer.getAnnounceMessage('dismissed');
    assert.equal(closed.message, 'Bottom drawer closed');
  });
});
