/**
 * Architecture Service: Distributed Lock Acquisition Timeout Optimizer
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-32]
 */

export interface LockConfig {
  baseBackoffMs: number;
  maxBackoffMs: number;
  jitterFactor: number;
  maxAttempts: number;
  lockTtlMs: number;
}

export interface LockResult {
  acquired: boolean;
  token?: string;
  attempts: number;
  totalWaitMs: number;
  resourceKey: string;
}

export class DistributedLockOptimizerService {
  private config: LockConfig;
  private activeLocks: Map<string, { token: string; expiresAt: number }>;

  constructor(config?: Partial<LockConfig>) {
    this.config = {
      baseBackoffMs: config?.baseBackoffMs ?? 20,
      maxBackoffMs: config?.maxBackoffMs ?? 500,
      jitterFactor: config?.jitterFactor ?? 0.3,
      maxAttempts: config?.maxAttempts ?? 5,
      lockTtlMs: config?.lockTtlMs ?? 3000
    };
    this.activeLocks = new Map();
  }

  public calculateBackoff(attempt: number, randomFn: () => number = Math.random): number {
    const rawBackoff = Math.min(
      this.config.maxBackoffMs,
      this.config.baseBackoffMs * Math.pow(2, attempt)
    );
    const jitter = (randomFn() * 2 - 1) * this.config.jitterFactor * rawBackoff;
    return Math.max(this.config.baseBackoffMs, Math.round(rawBackoff + jitter));
  }

  public tryAcquireSync(resourceKey: string, now: number = Date.now()): { acquired: boolean; token?: string } {
    const current = this.activeLocks.get(resourceKey);
    if (current && now < current.expiresAt) {
      return { acquired: false };
    }

    const token = 'lock_' + Math.random().toString(36).substring(2, 10);
    this.activeLocks.set(resourceKey, {
      token,
      expiresAt: now + this.config.lockTtlMs
    });
    return { acquired: true, token };
  }

  public async acquireLock(
    resourceKey: string,
    sleepFn: (ms: number) => Promise<void> = (ms) => new Promise(r => setTimeout(r, ms))
  ): Promise<LockResult> {
    let attempts = 0;
    let totalWaitMs = 0;

    while (attempts < this.config.maxAttempts) {
      attempts++;
      const res = this.tryAcquireSync(resourceKey);
      if (res.acquired && res.token) {
        return {
          acquired: true,
          token: res.token,
          attempts,
          totalWaitMs,
          resourceKey
        };
      }

      if (attempts >= this.config.maxAttempts) {
        break;
      }

      const backoff = this.calculateBackoff(attempts);
      totalWaitMs += backoff;
      await sleepFn(backoff);
    }

    return {
      acquired: false,
      attempts,
      totalWaitMs,
      resourceKey
    };
  }

  public releaseLock(resourceKey: string, token: string): boolean {
    const current = this.activeLocks.get(resourceKey);
    if (!current) return false;
    if (current.token === token) {
      this.activeLocks.delete(resourceKey);
      return true;
    }
    return false;
  }

  public isLocked(resourceKey: string, now: number = Date.now()): boolean {
    const current = this.activeLocks.get(resourceKey);
    return !!current && now < current.expiresAt;
  }
}
