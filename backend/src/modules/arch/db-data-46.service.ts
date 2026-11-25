/**
 * Architecture Service: Connection Pool Thread Starvation Watchdog
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-46]
 */

export interface ThreadPoolSnapshot {
  activeThreads: number;
  maxThreads: number;
  queuedTasks: number;
  longestQueuedDurationMs: number;
}

export class ConnectionPoolThreadStarvationWatchdogService {
  private starvationWaitThresholdMs: number;

  constructor(starvationWaitThresholdMs: number = 5000) {
    this.starvationWaitThresholdMs = starvationWaitThresholdMs;
  }

  public evaluateStarvation(snapshot: ThreadPoolSnapshot): {
    isStarved: boolean;
    severity: 'NORMAL' | 'WARN' | 'CRITICAL';
    message: string;
    stackTrace?: string;
  } {
    if (snapshot.queuedTasks > 0 && snapshot.longestQueuedDurationMs >= this.starvationWaitThresholdMs) {
      const isCritical = snapshot.activeThreads >= snapshot.maxThreads;
      const stack = new Error('Thread starvation snapshot').stack;
      return {
        isStarved: true,
        severity: isCritical ? 'CRITICAL' : 'WARN',
        message: `Thread starvation detected: ${snapshot.queuedTasks} queued tasks waiting for ${snapshot.longestQueuedDurationMs}ms (Active: ${snapshot.activeThreads}/${snapshot.maxThreads})`,
        stackTrace: stack
      };
    }

    return {
      isStarved: false,
      severity: 'NORMAL',
      message: 'Connection pool thread pool healthy'
    };
  }
}
