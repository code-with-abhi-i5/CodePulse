import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AccessibleKeyboardNavigationStateMachineService } from './fe-ui-07.service.ts';

describe('AccessibleKeyboardNavigationStateMachineService (FE-UI-07)', () => {
  it('cycles focus through registered focusable elements with arrow keys and wrap-around', () => {
    const nav = new AccessibleKeyboardNavigationStateMachineService(['btn_run', 'btn_submit', 'btn_reset']);
    assert.strictEqual(nav.getActiveElementId(), 'btn_run');

    assert.strictEqual(nav.handleKeyDown('ArrowDown'), 'btn_submit');
    assert.strictEqual(nav.handleKeyDown('ArrowDown'), 'btn_reset');
    // Wrap around to start
    assert.strictEqual(nav.handleKeyDown('ArrowDown'), 'btn_run');

    // Arrow up wrap-around to end
    assert.strictEqual(nav.handleKeyDown('ArrowUp'), 'btn_reset');

    // Home / End
    assert.strictEqual(nav.handleKeyDown('Home'), 'btn_run');
    assert.strictEqual(nav.handleKeyDown('End'), 'btn_reset');
  });
});
