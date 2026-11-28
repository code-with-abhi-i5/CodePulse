import test from 'node:test';
import assert from 'node:assert/strict';
import { DialogFocusTrapSentinel } from './dialog-focus-trap-sentinel.service.ts';

test('DialogFocusTrapSentinel [L2-MODAL-A11Y-MOTION-051]', async (t) => {
  const sentinel = new DialogFocusTrapSentinel();
  const elements = ['input-1', 'button-confirm', 'button-cancel'];

  await t.test('wraps forward tab from last element to first', () => {
    assert.equal(sentinel.resolveNextFocus(elements, 2, false), 0);
    assert.equal(sentinel.resolveNextFocus(elements, 0, false), 1);
  });

  await t.test('wraps backward shift-tab from first element to last', () => {
    assert.equal(sentinel.resolveNextFocus(elements, 0, true), 2);
    assert.equal(sentinel.resolveNextFocus(elements, 2, true), 1);
  });

  await t.test('handles empty focus list gracefully', () => {
    assert.equal(sentinel.resolveNextFocus([], 0, false), -1);
  });
});
