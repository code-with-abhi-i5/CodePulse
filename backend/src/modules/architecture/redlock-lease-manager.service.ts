export interface RedlockLock {
  resource: string;
  value: string;
  validityMs: number;
}

export class RedlockLeaseManager {
  private instancesCount: number;
  private quorum: number;
  private driftFactor: number;
  private storage = new Map<string, { value: string; expiresAt: number }>();

  constructor(instancesCount = 3, driftFactor = 0.01) {
    this.instancesCount = instancesCount;
    this.quorum = Math.floor(instancesCount / 2) + 1;
    this.driftFactor = driftFactor;
  }

  public acquire(resource: string, ttlMs: number): RedlockLock | null {
    const lockVal = Math.random().toString(36).substring(2, 15);
    const start = Date.now();

    // Check simulated instances
    const now = Date.now();
    const existing = this.storage.get(resource);
    if (existing && existing.expiresAt > now) {
      return null; // Resource locked
    }

    // Set lock
    this.storage.set(resource, { value: lockVal, expiresAt: now + ttlMs });

    const elapsed = Date.now() - start;
    const drift = Math.floor(ttlMs * this.driftFactor) + 2;
    const validityMs = ttlMs - elapsed - drift;

    if (validityMs > 0) {
      return { resource, value: lockVal, validityMs };
    } else {
      this.storage.delete(resource);
      return null;
    }
  }

  public release(lock: RedlockLock): boolean {
    const current = this.storage.get(lock.resource);
    if (current && current.value === lock.value) {
      this.storage.delete(lock.resource);
      return true;
    }
    return false;
  }
}
