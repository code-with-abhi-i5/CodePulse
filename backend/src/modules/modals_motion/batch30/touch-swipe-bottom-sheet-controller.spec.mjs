import test from 'node:test';
import assert from 'node:assert/strict';
import { TouchSwipeBottomSheetController } from './touch-swipe-bottom-sheet-controller.service.ts';

test('TouchSwipeBottomSheetController [L2-MODAL-A11Y-MOTION-009]', async (t) => {
  const controller = new TouchSwipeBottomSheetController();

  await t.test('triggers spring-back to 0 if drag was under threshold', () => {
    const snap = controller.calculateSpringBack(60, 100);
    assert.equal(snap.shouldDismiss, false);
    assert.equal(snap.targetY, 0);

    const dismiss = controller.calculateSpringBack(120, 100);
    assert.equal(dismiss.shouldDismiss, true);
    assert.equal(dismiss.targetY, 400);
  });
});
