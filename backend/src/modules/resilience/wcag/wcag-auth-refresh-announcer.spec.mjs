import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { WcagAuthRefreshAnnouncer } from './wcag-auth-refresh-announcer.service.ts';

describe('WcagAuthRefreshAnnouncer [L2-ERROR-RETRY-OFFLINE-036]', () => {
  const announcer = new WcagAuthRefreshAnnouncer();

  test('generates polite live region announcements during session refresh', () => {
    const r1 = announcer.getStatusLiveRegion(true);
    assert.equal(r1.ariaLive, 'polite');
    assert.ok(r1.text.includes('Refreshing'));

    const r2 = announcer.getStatusLiveRegion(false);
    assert.ok(r2.text.includes('successfully refreshed'));
  });
});
