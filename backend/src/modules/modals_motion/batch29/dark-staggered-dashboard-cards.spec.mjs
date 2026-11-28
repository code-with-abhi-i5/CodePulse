import test from 'node:test';
import assert from 'node:assert/strict';
import { DarkStaggeredDashboardCards } from './dark-staggered-dashboard-cards.service.ts';

test('DarkStaggeredDashboardCards [L2-MODAL-A11Y-MOTION-024]', async (t) => {
  const cards = new DarkStaggeredDashboardCards();

  await t.test('returns dark slate card tokens with staggered delay', () => {
    const card0 = cards.getCardStyles(0);
    assert.equal(card0.backgroundColor, '#1e293b');
    assert.equal(card0.animationDelay, '0ms');

    const card2 = cards.getCardStyles(2);
    assert.equal(card2.animationDelay, '150ms');
  });
});
