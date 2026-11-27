import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { WcagErrorBoundaryA11y } from './wcag-error-boundary.service.ts';

describe('WcagErrorBoundaryA11y [L2-ERROR-RETRY-OFFLINE-031]', () => {
  const a11y = new WcagErrorBoundaryA11y();

  test('provides assertive alert role for crash recovery container', () => {
    const props = a11y.getErrorContainerProps();
    assert.equal(props.role, 'alert');
    assert.equal(props.ariaLive, 'assertive');
  });
});
