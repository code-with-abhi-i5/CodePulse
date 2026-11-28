import test from 'node:test';
import assert from 'node:assert/strict';
import { ViewportStaggeredDashboardLayout } from './viewport-staggered-dashboard-layout.service.ts';

test('ViewportStaggeredDashboardLayout [L2-MODAL-A11Y-MOTION-014]', async (t) => {
  const layout = new ViewportStaggeredDashboardLayout();

  await t.test('calculates responsive column count across screen widths', () => {
    assert.equal(layout.getGridColumns(400), 1);
    assert.equal(layout.getGridColumns(768), 2);
    assert.equal(layout.getGridColumns(1280), 3);
  });
});
