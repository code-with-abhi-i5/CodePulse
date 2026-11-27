import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DistributedSemaphoreCoordinator } from './distributed-semaphore.service.ts';

describe('DistributedSemaphoreCoordinator [ARCH-CORE-026]', () => {
  test('enforces concurrency bounds per team', () => {
    const sem = new DistributedSemaphoreCoordinator(5000);
    const p1 = sem.acquire('team_red', 2);
    const p2 = sem.acquire('team_red', 2);
    const p3 = sem.acquire('team_red', 2); // 3rd exceeds max=2

    assert.ok(p1);
    assert.ok(p2);
    assert.equal(p3, null);
    assert.equal(sem.getActivePermits('team_red'), 2);

    sem.release('team_red', p1);
    assert.equal(sem.getActivePermits('team_red'), 1);

    const p4 = sem.acquire('team_red', 2);
    assert.ok(p4);
  });

  test('cleans up expired permits automatically', () => {
    const sem = new DistributedSemaphoreCoordinator(50); // 50ms TTL
    const p = sem.acquire('team_blue', 1, 10);
    assert.ok(p);

    // Wait for permit to expire
    const start = Date.now();
    while (Date.now() - start < 20) {}

    assert.equal(sem.getActivePermits('team_blue'), 0);
  });
});
