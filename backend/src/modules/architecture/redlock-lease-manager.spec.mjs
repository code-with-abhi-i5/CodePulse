import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { RedlockLeaseManager } from './redlock-lease-manager.service.ts';

describe('RedlockLeaseManager [ARCH-CORE-016]', () => {
  test('acquires distributed lock with clock drift compensation and releases cleanly', () => {
    const redlock = new RedlockLeaseManager(3);
    const lock = redlock.acquire('res_game_42', 2000);
    assert.ok(lock);
    assert.ok(lock.validityMs > 1800);

    // Concurrent acquire should fail
    const concurrent = redlock.acquire('res_game_42', 2000);
    assert.equal(concurrent, null);

    const released = redlock.release(lock);
    assert.equal(released, true);

    // Can re-acquire after release
    const reacquired = redlock.acquire('res_game_42', 2000);
    assert.ok(reacquired);
  });
});
