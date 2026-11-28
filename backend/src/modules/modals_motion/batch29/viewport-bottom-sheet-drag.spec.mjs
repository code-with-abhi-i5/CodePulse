import test from 'node:test';
import assert from 'node:assert/strict';
import { ViewportBottomSheetDrag } from './viewport-bottom-sheet-drag.service.ts';

test('ViewportBottomSheetDrag [L2-MODAL-A11Y-MOTION-019]', async (t) => {
  const drag = new ViewportBottomSheetDrag();

  await t.test('computes relative drag limits based on mobile screen height', () => {
    const constraints = drag.getDragConstraints(800);
    assert.equal(constraints.maxDragY, 560);
    assert.equal(constraints.dismissThresholdY, 200);
    assert.equal(constraints.touchTargetMinHeightPx, 48);
  });
});
