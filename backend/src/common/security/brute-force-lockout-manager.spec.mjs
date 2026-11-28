import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class BruteForceLockoutManagerService {
  constructor(strikeThreshold = 5, lockoutDurationMs = 300000) {
    this.strikeThreshold = strikeThreshold;
    this.lockoutDurationMs = lockoutDurationMs;
    this.strikeMap = new Map();
  }

  recordFailedAttempt(identity, now = Date.now()) {
    const current = this.strikeMap.get(identity) || { strikes: 0, lockedUntil: 0 };
    current.strikes++;

    if (current.strikes >= this.strikeThreshold) {
      current.lockedUntil = now + this.lockoutDurationMs;
    }

    this.strikeMap.set(identity, current);
    return this.checkStatus(identity, now);
  }

  checkStatus(identity, now = Date.now()) {
    const record = this.strikeMap.get(identity);
    if (!record) {
      return { isLocked: false, currentStrikes: 0, lockoutRemainingMs: 0, action: 'ALLOW' };
    }

    if (record.lockedUntil > now) {
      return {
        isLocked: true,
        currentStrikes: record.strikes,
        lockoutRemainingMs: record.lockedUntil - now,
        action: 'LOCKOUT'
      };
    }

    return {
      isLocked: false,
      currentStrikes: record.strikes,
      lockoutRemainingMs: 0,
      action: record.strikes >= 3 ? 'WARN' : 'ALLOW'
    };
  }

  resetStrikes(identity) {
    this.strikeMap.delete(identity);
  }
}

describe('BruteForceLockoutManagerService', () => {
  const manager = new BruteForceLockoutManagerService(3, 60000);

  it('tracks progressive strikes and triggers lockout on exceeding threshold', () => {
    const s1 = manager.recordFailedAttempt('user-target', 1000);
    assert.equal(s1.isLocked, false);
    assert.equal(s1.currentStrikes, 1);

    manager.recordFailedAttempt('user-target', 2000);
    const s3 = manager.recordFailedAttempt('user-target', 3000);
    assert.equal(s3.isLocked, true);
    assert.equal(s3.action, 'LOCKOUT');
    assert.equal(s3.lockoutRemainingMs, 60000);
  });

  it('resets lockout strikes upon successful authentication', () => {
    manager.resetStrikes('user-target');
    const status = manager.checkStatus('user-target', 4000);
    assert.equal(status.isLocked, false);
    assert.equal(status.currentStrikes, 0);
  });
});
