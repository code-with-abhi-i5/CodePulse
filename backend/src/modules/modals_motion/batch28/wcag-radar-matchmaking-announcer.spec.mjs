import test from 'node:test';
import assert from 'node:assert/strict';
import { WcagRadarMatchmakingAnnouncer } from './wcag-radar-matchmaking-announcer.service.ts';

test('WcagRadarMatchmakingAnnouncer [L2-MODAL-A11Y-MOTION-036]', async (t) => {
  const announcer = new WcagRadarMatchmakingAnnouncer();

  await t.test('announces periodic queue status as polite status', () => {
    const status = announcer.getQueueAnnouncement(15);
    assert.equal(status.role, 'status');
    assert.equal(status.ariaLive, 'polite');
    assert.ok(status.text.includes('15 seconds'));
  });

  await t.test('announces match found assertively as alert', () => {
    const alert = announcer.getQueueAnnouncement(25, 'Alex_Coder');
    assert.equal(alert.role, 'alert');
    assert.equal(alert.ariaLive, 'assertive');
    assert.ok(alert.text.includes('Alex_Coder'));
  });
});
