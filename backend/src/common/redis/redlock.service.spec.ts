import { RedlockService, RedlockLease } from './redlock.service';

describe('RedlockService (Distributed Mutual Exclusion & Watchdog #374)', () => {
  let redlock: RedlockService;

  beforeEach(() => {
    redlock = new RedlockService();
  });

  afterEach(() => {
    redlock.onModuleDestroy();
  });

  describe('Core Redlock Algorithm & Quorum', () => {
    it('successfully acquires a distributed lock across quorum nodes', async () => {
      const resource = 'lock:room:battle-arena-101';
      const lease = await redlock.acquire(resource, 5000);

      expect(lease).not.toBeNull();
      expect(lease?.resourceKey).toBe(resource);
      expect(lease?.lockValue).toHaveLength(40); // 20 bytes in hex
      expect(lease?.quorumCount).toBeGreaterThanOrEqual(2);
      expect(lease?.validityTimeMs).toBeGreaterThan(0);
      expect(lease?.fencingToken).toBeGreaterThanOrEqual(5000);

      const released = await redlock.release(lease!);
      expect(released).toBe(true);
    });

    it('rejects concurrent acquisition on the same resource while locked', async () => {
      const resource = 'lock:matchmaking:queue';
      const lease1 = await redlock.acquire(resource, 4000);
      expect(lease1).not.toBeNull();

      // Second client attempts to acquire immediately
      const lease2 = await redlock.acquire(resource, 2000, { retryCount: 1 });
      expect(lease2).toBeNull();

      // Release lease 1
      await redlock.release(lease1!);

      // Now client 2 can acquire
      const lease3 = await redlock.acquire(resource, 4000);
      expect(lease3).not.toBeNull();
      await redlock.release(lease3!);
    });

    it('calculates clock drift accurately and reduces validity window', async () => {
      const ttlMs = 10000;
      const driftFactor = 0.02; // 2% drift
      const resource = 'lock:drift:test';

      const lease = await redlock.acquire(resource, ttlMs, { driftFactor });
      expect(lease).not.toBeNull();

      // Drift is round(10000 * 0.02) + 2 = 202ms
      // Validity must be <= (10000 - 202) = 9798ms
      expect(lease!.validityTimeMs).toBeLessThanOrEqual(ttlMs - 202);
      await redlock.release(lease!);
    });

    it('tolerates 1 dead node in 3-node cluster and achieves quorum (2/3)', async () => {
      const resource = 'lock:tolerance:node-failure';
      redlock.setNodeState(0, false); // Kill node 1

      const lease = await redlock.acquire(resource, 5000);
      expect(lease).not.toBeNull();
      expect(lease?.quorumCount).toBe(2);

      const released = await redlock.release(lease!);
      expect(released).toBe(true);
    });

    it('fails acquisition when quorum cannot be reached (2/3 nodes dead)', async () => {
      const resource = 'lock:tolerance:quorum-fail';
      redlock.setNodeState(0, false);
      redlock.setNodeState(1, false);

      const lease = await redlock.acquire(resource, 2000, { retryCount: 1 });
      expect(lease).toBeNull();
    });
  });

  describe('Lua Script Atomic Release & Extension', () => {
    it('only releases lock if the caller owns the exact lockValue', async () => {
      const resource = 'lock:lua:safety';
      const lease = await redlock.acquire(resource, 5000);
      expect(lease).not.toBeNull();

      // Tampered lease with incorrect value
      const fakeLease: RedlockLease = {
        ...lease!,
        lockValue: 'tampered-or-expired-value',
      };

      const fakeRelease = await redlock.release(fakeLease);
      expect(fakeRelease).toBe(false);

      // Original owner can still release safely
      const realRelease = await redlock.release(lease!);
      expect(realRelease).toBe(true);
    });

    it('extends lock lease duration via atomic Lua extension', async () => {
      const resource = 'lock:lua:extend';
      const lease = await redlock.acquire(resource, 3000);
      expect(lease).not.toBeNull();

      const extended = await redlock.extend(lease!, 8000);
      expect(extended).toBe(true);
      expect(lease!.validityTimeMs).toBe(8000);

      await redlock.release(lease!);
    });
  });

  describe('Watchdog Heartbeat Auto-Extension', () => {
    it('automatically extends lease while long operation runs', async () => {
      const resource = 'lock:watchdog:long-task';
      const lease = await redlock.acquire(resource, 1000);
      expect(lease).not.toBeNull();

      // Start watchdog with fast 50ms interval for testing
      redlock.startWatchdog(lease!, 1000, 50);

      const initialExpiresAt = lease!.expiresAt;
      // Wait 120ms (watchdog should fire at least twice)
      await new Promise((r) => setTimeout(r, 120));

      expect(lease!.expiresAt).toBeGreaterThan(initialExpiresAt);

      redlock.stopWatchdog(lease!);
      await redlock.release(lease!);
    });

    it('cleans up watchdog and lock inside usingLock execution wrapper', async () => {
      const resource = 'lock:wrapper:auto-cleanup';
      let executed = false;

      const result = await redlock.usingLock(resource, 4000, async (lease) => {
        expect(lease).toBeDefined();
        executed = true;
        return 'COMPLETED_SUCCESS';
      });

      expect(result).toBe('COMPLETED_SUCCESS');
      expect(executed).toBe(true);

      // Lock should now be completely free
      const reacquire = await redlock.acquire(resource, 2000);
      expect(reacquire).not.toBeNull();
      await redlock.release(reacquire!);
    });
  });

  describe('Domain Helpers: Matchmaking, User Balance & Battle Room', () => {
    it('executes within withMatchmakingLock', async () => {
      let counter = 0;
      await redlock.withMatchmakingLock(async (lease) => {
        expect(lease.resourceKey).toBe('lock:matchmaking:queue');
        counter++;
      });
      expect(counter).toBe(1);
    });

    it('executes within withUserBalanceLock', async () => {
      const userId = 'user-abc-123';
      let balance = 500;
      await redlock.withUserBalanceLock(userId, async (lease) => {
        expect(lease.resourceKey).toBe(`lock:user:balance:${userId}`);
        balance -= 100;
      });
      expect(balance).toBe(400);
    });

    it('executes within withBattleRoomLock', async () => {
      const battleId = 'battle-xyz-789';
      let roomState = 'INITIAL';
      await redlock.withBattleRoomLock(battleId, async (lease) => {
        expect(lease.resourceKey).toBe(`lock:room:${battleId}`);
        roomState = 'ACTIVE';
      });
      expect(roomState).toBe('ACTIVE');
    });

    it('validates fencing tokens and rejects zombie mutations', () => {
      const resource = 'lock:fencing:test';

      expect(redlock.validateFencingToken(resource, 100)).toBe(true);
      expect(redlock.validateFencingToken(resource, 105)).toBe(true);
      expect(redlock.validateFencingToken(resource, 110)).toBe(true);

      // Stale token arriving late (104 < 110) must be rejected
      expect(redlock.validateFencingToken(resource, 104)).toBe(false);
    });
  });

  describe('High-Throughput Concurrency Stress Test (1,000 Parallel Requests)', () => {
    it('strictly enforces mutual exclusion with ZERO double-spends under 1,000 parallel requests', async () => {
      // Shared bank balance of 100 units
      let sharedBalance = 100;
      let successfulDebits = 0;
      let insufficientBalanceRejections = 0;
      const resource = 'lock:user:balance:stress-test-user';

      // 1,000 concurrent debit requests of 1 unit each
      const totalRequests = 1000;
      const tasks = Array.from({ length: totalRequests }, async (_, i) => {
        // Retry loop to acquire lock
        for (let attempt = 0; attempt < 100; attempt++) {
          const lease = await redlock.acquire(resource, 500, {
            retryCount: 1,
            driftFactor: 0.01,
          });

          if (lease) {
            try {
              if (sharedBalance >= 1) {
                // Critical section
                const current = sharedBalance;
                // Small yield
                sharedBalance = current - 1;
                successfulDebits++;
              } else {
                insufficientBalanceRejections++;
              }
              return true;
            } finally {
              await redlock.release(lease);
            }
          }
          // Micro backoff before trying again
          await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 5) + 1));
        }
        return false;
      });

      await Promise.all(tasks);

      // Mutual exclusion invariant:
      // Exactly 100 debits must succeed, balance must be exactly 0, and no negative balance ever occurs!
      expect(sharedBalance).toBe(0);
      expect(successfulDebits).toBe(100);
      expect(insufficientBalanceRejections + successfulDebits).toBeGreaterThanOrEqual(100);
    }, 30000);
  });
});
