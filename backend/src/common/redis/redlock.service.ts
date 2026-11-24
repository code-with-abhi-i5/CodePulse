import { Injectable, Logger, OnModuleDestroy, Optional } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { RedisService } from './redis.service';

export interface RedlockLease {
  resourceKey: string;
  lockValue: string;
  fencingToken: number;
  acquiredAt: number;
  validityTimeMs: number;
  expiresAt: number;
  quorumCount: number;
  participatingNodes: string[];
  watchdogTimer?: NodeJS.Timeout;
}

export interface RedlockOptions {
  ttlMs?: number;
  retryCount?: number;
  retryDelayMs?: number;
  retryJitterMs?: number;
  driftFactor?: number;
  autoExtend?: boolean;
  extendIntervalMs?: number;
}

export interface RedisNode {
  id: string;
  isAlive: boolean;
  set(key: string, value: string, ttlMs: number): Promise<boolean>;
  del(key: string, value: string): Promise<boolean>;
  extend(key: string, value: string, extensionMs: number): Promise<boolean>;
  get(key: string): Promise<string | null>;
}

@Injectable()
export class RedlockService implements OnModuleDestroy {
  private readonly logger = new Logger(RedlockService.name);

  // Algorithm configuration defaults
  public static readonly DEFAULT_TTL_MS = 30000; // 30,000 ms (30 seconds)
  public static readonly DEFAULT_RETRY_COUNT = 3;
  public static readonly DEFAULT_RETRY_DELAY_MS = 200;
  public static readonly DEFAULT_RETRY_JITTER_MS = 50;
  public static readonly DEFAULT_DRIFT_FACTOR = 0.01; // 1% clock drift margin
  public static readonly CLOCK_DRIFT_BUFFER_MS = 2; // 2ms minimum buffer

  // Monotonically increasing fencing token generator to reject stale/zombie writes
  private globalFencingSequence = 5000;
  private readonly lastSeenFencingTokens = new Map<string, number>();

  // Cluster nodes (simulating 3 independent Redis instances, or delegating to RedisService)
  private readonly redisNodes: RedisNode[] = [];
  private readonly activeWatchdogs = new Map<string, NodeJS.Timeout>();

  // In-memory fallback key-value store for single-node / testing
  private readonly memoryStore = new Map<string, { value: string; expiresAt: number }>();

  // Lua script definitions for atomic verification
  public static readonly RELEASE_LUA = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  public static readonly EXTEND_LUA = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("pexpire", KEYS[1], ARGV[2])
    else
      return 0
    end
  `;

  constructor(@Optional() private readonly redisService?: RedisService) {
    this.initializeClusterNodes();
  }

  private initializeClusterNodes(): void {
    // 3 independent nodes for standard Redlock quorum algorithm
    for (let i = 1; i <= 3; i++) {
      const nodeStore = new Map<string, { value: string; expiresAt: number }>();
      this.redisNodes.push({
        id: `redlock-node-${i}`,
        isAlive: true,
        set: async (key: string, value: string, ttlMs: number): Promise<boolean> => {
          const now = Date.now();
          const existing = nodeStore.get(key);
          if (existing && existing.expiresAt > now) {
            return false;
          }
          nodeStore.set(key, { value, expiresAt: now + ttlMs });
          return true;
        },
        del: async (key: string, value: string): Promise<boolean> => {
          const existing = nodeStore.get(key);
          if (existing && existing.value === value) {
            nodeStore.delete(key);
            return true;
          }
          return false;
        },
        extend: async (key: string, value: string, extensionMs: number): Promise<boolean> => {
          const existing = nodeStore.get(key);
          if (existing && existing.value === value && existing.expiresAt > Date.now()) {
            existing.expiresAt = Date.now() + extensionMs;
            return true;
          }
          return false;
        },
        get: async (key: string): Promise<string | null> => {
          const existing = nodeStore.get(key);
          if (existing && existing.expiresAt > Date.now()) {
            return existing.value;
          }
          return null;
        },
      });
    }
  }

  public onModuleDestroy(): void {
    for (const timer of this.activeWatchdogs.values()) {
      clearInterval(timer);
    }
    this.activeWatchdogs.clear();
  }

  /**
   * Acquires a distributed lock adhering to the Redlock algorithm.
   * Uses SET resource_name my_random_value NX PX ttlMs.
   */
  public async acquire(
    resourceKey: string,
    ttlMs: number = RedlockService.DEFAULT_TTL_MS,
    options: RedlockOptions = {}
  ): Promise<RedlockLease | null> {
    const retryCount = options.retryCount ?? RedlockService.DEFAULT_RETRY_COUNT;
    const retryDelay = options.retryDelayMs ?? RedlockService.DEFAULT_RETRY_DELAY_MS;
    const retryJitter = options.retryJitterMs ?? RedlockService.DEFAULT_RETRY_JITTER_MS;
    const driftFactor = options.driftFactor ?? RedlockService.DEFAULT_DRIFT_FACTOR;

    const lockValue = randomBytes(20).toString('hex');
    const quorum = Math.floor(this.redisNodes.length / 2) + 1; // 2 out of 3

    for (let attempt = 1; attempt <= retryCount; attempt++) {
      const startTime = Date.now();
      const successfulNodes: string[] = [];

      // If a real Redis client is connected, execute atomic SET NX PX
      const client = this.redisService?.getClient();
      if (client && (this.redisService as any)?.isRedisConnected?.()) {
        try {
          const result = await client.set(resourceKey, lockValue, 'PX', ttlMs, 'NX');
          const elapsed = Date.now() - startTime;
          const drift = Math.round(ttlMs * driftFactor) + RedlockService.CLOCK_DRIFT_BUFFER_MS;
          const validityTime = ttlMs - elapsed - drift;

          if (result === 'OK' && validityTime > 0) {
            this.globalFencingSequence += 1;
            const fencingToken = this.globalFencingSequence;
            this.lastSeenFencingTokens.set(resourceKey, fencingToken);

            const lease: RedlockLease = {
              resourceKey,
              lockValue,
              fencingToken,
              acquiredAt: startTime,
              validityTimeMs: validityTime,
              expiresAt: startTime + ttlMs,
              quorumCount: 1,
              participatingNodes: ['redis-master'],
            };

            if (options.autoExtend) {
              this.startWatchdog(lease, ttlMs, options.extendIntervalMs);
            }
            return lease;
          } else if (result === 'OK') {
            // Expired before validity check: release lock
            await client.eval(RedlockService.RELEASE_LUA, 1, resourceKey, lockValue);
          }
        } catch (err: any) {
          this.logger.debug(`Redis standalone acquire error: ${err.message}`);
        }
      } else {
        // Multi-instance / simulated cluster Redlock
        const acquisitionPromises = this.redisNodes.map(async (node) => {
          if (!node.isAlive) return false;
          try {
            const success = await node.set(resourceKey, lockValue, ttlMs);
            if (success) {
              successfulNodes.push(node.id);
              return true;
            }
          } catch (err: any) {
            this.logger.debug(`Node ${node.id} acquisition error: ${err.message}`);
          }
          return false;
        });

        await Promise.allSettled(acquisitionPromises);

        const elapsedTime = Date.now() - startTime;
        const drift = Math.round(ttlMs * driftFactor) + RedlockService.CLOCK_DRIFT_BUFFER_MS;
        const validityTime = ttlMs - elapsedTime - drift;

        if (successfulNodes.length >= quorum && validityTime > 0) {
          this.globalFencingSequence += 1;
          const fencingToken = this.globalFencingSequence;
          this.lastSeenFencingTokens.set(resourceKey, fencingToken);

          const lease: RedlockLease = {
            resourceKey,
            lockValue,
            fencingToken,
            acquiredAt: startTime,
            validityTimeMs: validityTime,
            expiresAt: startTime + ttlMs,
            quorumCount: successfulNodes.length,
            participatingNodes: successfulNodes,
          };

          if (options.autoExtend) {
            this.startWatchdog(lease, ttlMs, options.extendIntervalMs);
          }
          return lease;
        }

        // Quorum failed or lease expired during acquisition: unlock nodes immediately
        await this.unlockAcrossNodes(resourceKey, lockValue);
      }

      if (attempt < retryCount) {
        const jitter = Math.floor(Math.random() * retryJitter);
        await new Promise((r) => setTimeout(r, retryDelay + jitter));
      }
    }

    return null;
  }

  /**
   * Releases the distributed lock atomically using Lua script verifying lockValue identity.
   */
  public async release(lease: RedlockLease): Promise<boolean> {
    if (!lease || !lease.resourceKey || !lease.lockValue) {
      return false;
    }

    this.stopWatchdog(lease);

    const client = this.redisService?.getClient();
    if (client && (this.redisService as any)?.isRedisConnected?.()) {
      try {
        const res = await client.eval(RedlockService.RELEASE_LUA, 1, lease.resourceKey, lease.lockValue);
        return Number(res) === 1;
      } catch (err: any) {
        this.logger.debug(`Redis release error: ${err.message}`);
      }
    }

    const releasedNodes = await this.unlockAcrossNodes(lease.resourceKey, lease.lockValue);
    const quorum = Math.floor(this.redisNodes.length / 2) + 1;
    return releasedNodes >= quorum;
  }

  /**
   * Extends lock lease validity across nodes (heartbeat renewal).
   */
  public async extend(lease: RedlockLease, extensionMs: number = RedlockService.DEFAULT_TTL_MS): Promise<boolean> {
    if (!lease || !lease.resourceKey || !lease.lockValue) {
      return false;
    }

    const client = this.redisService?.getClient();
    if (client && (this.redisService as any)?.isRedisConnected?.()) {
      try {
        const res = await client.eval(RedlockService.EXTEND_LUA, 1, lease.resourceKey, lease.lockValue, extensionMs);
        if (Number(res) === 1) {
          lease.expiresAt = Date.now() + extensionMs;
          lease.validityTimeMs = extensionMs;
          return true;
        }
        return false;
      } catch (err: any) {
        this.logger.debug(`Redis extend error: ${err.message}`);
        return false;
      }
    }

    let successCount = 0;
    const quorum = Math.floor(this.redisNodes.length / 2) + 1;

    for (const node of this.redisNodes) {
      if (!node.isAlive) continue;
      const extended = await node.extend(lease.resourceKey, lease.lockValue, extensionMs);
      if (extended) successCount++;
    }

    if (successCount >= quorum) {
      lease.expiresAt = Date.now() + extensionMs;
      lease.validityTimeMs = extensionMs;
      return true;
    }
    return false;
  }

  /**
   * Starts automatic lock auto-extension (heartbeat watchdog) for long-running transactional operations.
   */
  public startWatchdog(
    lease: RedlockLease,
    ttlMs: number = RedlockService.DEFAULT_TTL_MS,
    intervalMs?: number
  ): NodeJS.Timeout {
    const watchdogKey = `${lease.resourceKey}:${lease.lockValue}`;
    this.stopWatchdog(lease);

    // Watchdog heartbeat interval defaults to 1/3 of TTL
    const heartbeatInterval = intervalMs ?? Math.max(50, Math.floor(ttlMs / 3));

    const timer = setInterval(async () => {
      try {
        const extended = await this.extend(lease, ttlMs);
        if (!extended) {
          this.stopWatchdog(lease);
        }
      } catch (err: any) {
        this.logger.warn(`Watchdog auto-extension failed for '${lease.resourceKey}': ${err.message}`);
        this.stopWatchdog(lease);
      }
    }, heartbeatInterval);

    lease.watchdogTimer = timer;
    this.activeWatchdogs.set(watchdogKey, timer);
    return timer;
  }

  /**
   * Stops the automatic lock watchdog.
   */
  public stopWatchdog(lease: RedlockLease): void {
    const watchdogKey = `${lease.resourceKey}:${lease.lockValue}`;
    const timer = lease.watchdogTimer || this.activeWatchdogs.get(watchdogKey);
    if (timer) {
      clearInterval(timer);
      lease.watchdogTimer = undefined;
      this.activeWatchdogs.delete(watchdogKey);
    }
  }

  /**
   * Executes a block within a distributed lock, guaranteeing cleanup and auto-extension.
   */
  public async usingLock<T>(
    resourceKey: string,
    ttlMs: number,
    operation: (lease: RedlockLease) => Promise<T>,
    options: RedlockOptions = {}
  ): Promise<T> {
    const lease = await this.acquire(resourceKey, ttlMs, {
      ...options,
      autoExtend: options.autoExtend ?? true,
    });

    if (!lease) {
      throw new Error(`Failed to acquire distributed Redlock for '${resourceKey}'`);
    }

    try {
      return await operation(lease);
    } finally {
      await this.release(lease);
    }
  }

  // --- Domain Helper Methods for Critical Paths ---

  /**
   * Protects matchmaking queue from concurrent dequeue / double-match race conditions.
   * Lock key: `lock:matchmaking:queue`
   */
  public async withMatchmakingLock<T>(
    operation: (lease: RedlockLease) => Promise<T>,
    ttlMs: number = 10000
  ): Promise<T> {
    return this.usingLock('lock:matchmaking:queue', ttlMs, operation, {
      retryCount: 10,
      retryDelayMs: 50,
      retryJitterMs: 25,
      autoExtend: true,
    });
  }

  /**
   * Protects user XP / wagering balance from concurrent double-spend across clustered instances.
   * Lock key: `lock:user:balance:<userId>`
   */
  public async withUserBalanceLock<T>(
    userId: string,
    operation: (lease: RedlockLease) => Promise<T>,
    ttlMs: number = 15000
  ): Promise<T> {
    return this.usingLock(`lock:user:balance:${userId}`, ttlMs, operation, {
      retryCount: 15,
      retryDelayMs: 40,
      retryJitterMs: 20,
      autoExtend: true,
    });
  }

  /**
   * Protects battle room state and mutations from concurrent room actions.
   * Lock key: `lock:room:<battleId>`
   */
  public async withBattleRoomLock<T>(
    battleId: string,
    operation: (lease: RedlockLease) => Promise<T>,
    ttlMs: number = 15000
  ): Promise<T> {
    return this.usingLock(`lock:room:${battleId}`, ttlMs, operation, {
      retryCount: 10,
      retryDelayMs: 50,
      retryJitterMs: 25,
      autoExtend: true,
    });
  }

  /**
   * Validates fencing token to eliminate zombie mutations.
   */
  public validateFencingToken(resourceKey: string, token: number): boolean {
    const lastSeen = this.lastSeenFencingTokens.get(resourceKey);
    if (lastSeen === undefined) {
      this.lastSeenFencingTokens.set(resourceKey, token);
      return true;
    }
    if (token < lastSeen) {
      this.logger.error(
        `[Redlock] Zombie mutation rejected on '${resourceKey}': received token ${token} < highest seen ${lastSeen}`
      );
      return false;
    }
    this.lastSeenFencingTokens.set(resourceKey, token);
    return true;
  }

  private async unlockAcrossNodes(resourceKey: string, lockValue: string): Promise<number> {
    let successfulDeletions = 0;
    const deletionPromises = this.redisNodes.map(async (node) => {
      if (!node.isAlive) return;
      try {
        const deleted = await node.del(resourceKey, lockValue);
        if (deleted) successfulDeletions++;
      } catch (err: any) {
        this.logger.debug(`Error unlocking on ${node.id}: ${err.message}`);
      }
    });

    await Promise.allSettled(deletionPromises);
    return successfulDeletions;
  }

  public setNodeState(nodeIndex: number, isAlive: boolean): void {
    if (this.redisNodes[nodeIndex]) {
      this.redisNodes[nodeIndex].isAlive = isAlive;
    }
  }

  public getNodes(): RedisNode[] {
    return this.redisNodes;
  }
}
