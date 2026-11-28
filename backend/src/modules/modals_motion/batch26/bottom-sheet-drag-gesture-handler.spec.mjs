import test from 'node:test';
import assert from 'node:assert/strict';
import { BottomSheetDragGestureHandler } from './bottom-sheet-drag-gesture-handler.service.ts';

test('BottomSheetDragGestureHandler [L2-MODAL-A11Y-MOTION-059]', async (t) => {
  const handler = new BottomSheetDragGestureHandler();

  await t.test('dismisses bottom sheet if dragged past distance threshold', () => {
    assert.equal(handler.evaluateDismissal(150, 0.1), true);
    assert.equal(handler.evaluateDismissal(50, 0.1), false);
  });

  await t.test('dismisses bottom sheet on quick downward flick regardless of distance', () => {
    assert.equal(handler.evaluateDismissal(40, 0.8), true);
    assert.equal(handler.evaluateDismissal(-20, 1.0), false);
  });

  await t.test('computes CSS transform string with zero minimum clamp', () => {
    assert.equal(handler.computeTransform(85), 'translateY(85px)');
    assert.equal(handler.computeTransform(-10), 'translateY(0px)');
  });
});
