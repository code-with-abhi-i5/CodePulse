export interface SemaphorePermit {
  permitId: string;
  teamId: string;
  acquiredAt: number;
  expiresAt: number;
}

export class DistributedSemaphoreCoordinator {
  private permits = new Map<string, SemaphorePermit[]>(); // teamId -> SemaphorePermit[]
  private defaultTtlMs: number;

  constructor(defaultTtlMs = 10000) {
    this.defaultTtlMs = defaultTtlMs;
  }

  public acquire(teamId: string, maxPermits: number, ttlMs = this.defaultTtlMs): string | null {
    this.cleanExpired(teamId);
    const current = this.permits.get(teamId) || [];

    if (current.length >= maxPermits) {
      return null;
    }

    const permitId = `permit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = Date.now();
    const permit: SemaphorePermit = {
      permitId,
      teamId,
      acquiredAt: now,
      expiresAt: now + ttlMs
    };

    current.push(permit);
    this.permits.set(teamId, current);
    return permitId;
  }

  public release(teamId: string, permitId: string): boolean {
    const current = this.permits.get(teamId);
    if (!current) return false;

    const filtered = current.filter(p => p.permitId !== permitId);
    const removed = filtered.length < current.length;
    this.permits.set(teamId, filtered);
    return removed;
  }

  public cleanExpired(teamId: string): number {
    const current = this.permits.get(teamId);
    if (!current) return 0;

    const now = Date.now();
    const valid = current.filter(p => p.expiresAt > now);
    const expiredCount = current.length - valid.length;
    this.permits.set(teamId, valid);
    return expiredCount;
  }

  public getActivePermits(teamId: string): number {
    this.cleanExpired(teamId);
    return (this.permits.get(teamId) || []).length;
  }
}
