import test from 'node:test';
import assert from 'node:assert/strict';
import { EscapeKeyListenerRegistry } from './escape-key-listener-registry.service.ts';

test('EscapeKeyListenerRegistry [L2-MODAL-A11Y-MOTION-053]', async (t) => {
  const registry = new EscapeKeyListenerRegistry();

  await t.test('handles escape in LIFO order for nested modals and drawers', () => {
    let closed1 = false;
    let closed2 = false;

    registry.register('modal-1', () => { closed1 = true; });
    registry.register('drawer-child', () => { closed2 = true; });
    assert.equal(registry.getActiveCount(), 2);

    const handled1 = registry.handleEscapeKey();
    assert.equal(handled1, true);
    assert.equal(closed2, true); // child closed first
    assert.equal(closed1, false);

    const handled2 = registry.handleEscapeKey();
    assert.equal(handled2, true);
    assert.equal(closed1, true); // parent closed next

    assert.equal(registry.handleEscapeKey(), false); // empty
  });
});
