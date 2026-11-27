import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { WcagBookmarkAnnouncer } from './wcag-bookmark-announcer.service.ts';

describe('WcagBookmarkAnnouncer [L2-ERROR-RETRY-OFFLINE-039]', () => {
  const announcer = new WcagBookmarkAnnouncer();

  test('announces bookmark addition politely', () => {
    const a = announcer.formatAnnouncement('Two Sum', true);
    assert.equal(a.ariaLive, 'polite');
    assert.equal(a.announcement, 'Two Sum added to bookmarks.');
  });

  test('announces mutation failure assertively for screen readers', () => {
    const a = announcer.formatAnnouncement('Two Sum', false, true);
    assert.equal(a.ariaLive, 'assertive');
    assert.ok(a.announcement.includes('Error saving bookmark'));
  });
});
