/**
 * Architecture Service: Prisma Connection Pool Exhaustion Deadlock Detector & Recovery
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-01]
 */

export interface PoolStats {
  activeConnections: number;
  idleConnections: number;
  maxPoolSize: number;
  queuedRequests: number;
  longestWaitMs: number;
}

export class PrismaConnectionPoolDeadlockService {
  private maxAllowedWaitMs: number;
  private autoExpandLimit: number;

  constructor(maxAllowedWaitMs: number = 5000, autoExpandLimit: number = 50) {
    this.maxAllowedWaitMs = maxAllowedWaitMs;
    this.autoExpandLimit = autoExpandLimit;
  }

  public evaluatePoolHealth(stats: PoolStats): {
    isDeadlocked: boolean;
    recommendedAction: 'NONE' | 'REAP_ZOMBIE' | 'EXPAND_POOL' | 'RESTART_POOL';
    newPoolSize?: number;
  } {
    if (stats.queuedRequests > 0 && stats.longestWaitMs > this.maxAllowedWaitMs) {
      if (stats.activeConnections >= stats.maxPoolSize) {
        if (stats.maxPoolSize < this.autoExpandLimit) {
          const newSize = Math.min(this.autoExpandLimit, stats.maxPoolSize + 5);
          return { isDeadlocked: true, recommendedAction: 'EXPAND_POOL', newPoolSize: newSize };
        }
        return { isDeadlocked: true, recommendedAction: 'REAP_ZOMBIE' };
      }
    }
    return { isDeadlocked: false, recommendedAction: 'NONE' };
  }
}
