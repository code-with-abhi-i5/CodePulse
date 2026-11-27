import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { WcagQueryRetryStateAnnouncer } from './wcag-retry-announcer.service.ts';

describe('WcagQueryRetryStateAnnouncer [L2-ERROR-RETRY-OFFLINE-033]', () => {
  const announcer = new WcagQueryRetryStateAnnouncer();

  test('formats polite retry status announcement for screen readers', () => {
    const res = announcer.formatRetryStatus(2, 3);
    assert.equal(res.ariaLive, 'polite');
    assert.equal(res.text, 'Network connection failed. Retrying request, attempt 2 of 3.');
  });
});
