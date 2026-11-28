import test from 'node:test';
import assert from 'node:assert/strict';
import { WcagBountyConfettiAnnouncer } from './wcag-bounty-confetti-announcer.service.ts';

test('WcagBountyConfettiAnnouncer [L2-MODAL-A11Y-MOTION-032]', async (t) => {
  const announcer = new WcagBountyConfettiAnnouncer();

  await t.test('provides accessible text alternative and polite live announcement', () => {
    const ann = announcer.getClaimAnnouncement('OAuth Fix', 250);
    assert.equal(ann.role, 'status');
    assert.equal(ann.ariaLive, 'polite');
    assert.ok(ann.message.includes('OAuth Fix'));
    assert.ok(ann.message.includes('250 XP'));
  });
});
