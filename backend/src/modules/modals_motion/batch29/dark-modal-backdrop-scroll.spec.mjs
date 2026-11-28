import test from 'node:test';
import assert from 'node:assert/strict';
import { DarkModalBackdropScroll } from './dark-modal-backdrop-scroll.service.ts';

test('DarkModalBackdropScroll [L2-MODAL-A11Y-MOTION-027]', async (t) => {
  const backdrop = new DarkModalBackdropScroll();

  await t.test('provides high-contrast dark translucent backdrop with blur', () => {
    const open = backdrop.getBackdropStyle(true);
    assert.equal(open.backgroundColor, 'rgba(0, 0, 0, 0.75)');
    assert.equal(open.backdropFilter, 'blur(4px)');
    assert.equal(open.overflow, 'hidden');

    const closed = backdrop.getBackdropStyle(false);
    assert.equal(closed.overflow, 'auto');
  });
});
