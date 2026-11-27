import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { InactivityWarningSentinelService } from './inactivity-warning-sentinel.service.ts';

describe('InactivityWarningSentinelService [L2-ERROR-RETRY-OFFLINE-058]', () => {
  test('returns ACTIVE when activity is recent', () => {
    const sentinel = new InactivityWarningSentinelService({ sessionDurationSec: 1800, warningWindowSec: 300 });
    const res = sentinel.evaluateSessionStatus();
    assert.equal(res.status, 'ACTIVE');
    assert.ok(res.remainingSec > 300);
  });

  test('triggers WARNING exactly within 5-minute threshold', () => {
    const sentinel = new InactivityWarningSentinelService({ sessionDurationSec: 1800, warningWindowSec: 300 });
    const now = Date.now();
    sentinel.recordActivity(now - 1600 * 1000); // 1600s elapsed, 200s left

    const res = sentinel.evaluateSessionStatus(now);
    assert.equal(res.status, 'WARNING');
    assert.equal(res.remainingSec, 200);
  });

  test('evaluates EXPIRED after full session timeout and extends on user action', () => {
    const sentinel = new InactivityWarningSentinelService({ sessionDurationSec: 1800, warningWindowSec: 300 });
    const now = Date.now();
    sentinel.recordActivity(now - 1900 * 1000); // 1900s elapsed

    assert.equal(sentinel.evaluateSessionStatus(now).status, 'EXPIRED');

    sentinel.extendSession(now);
    assert.equal(sentinel.evaluateSessionStatus(now).status, 'ACTIVE');
  });
});
