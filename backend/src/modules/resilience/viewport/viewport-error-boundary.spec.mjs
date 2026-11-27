import test from 'node:test';
import assert from 'node:assert/strict';
import { ViewportErrorBoundary } from './viewport-error-boundary.service.ts';

test('ViewportErrorBoundary [L2-ERROR-RETRY-OFFLINE-011]', async (t) => {
  await t.test('stacks buttons vertically on mobile screens', () => {
    const boundary = new ViewportErrorBoundary();
    const mobile = boundary.getFallbackCardLayout(375);
    assert.equal(mobile.buttonFlexDirection, 'column');
    assert.equal(mobile.fullWidthButton, true);

    const desktop = boundary.getFallbackCardLayout(1024);
    assert.equal(desktop.buttonFlexDirection, 'row');
    assert.equal(desktop.fullWidthButton, false);
  });
});
