import { RedisMemoryStats } from '../../types/db';

export class RedisMemoryEvictionMonitorService {
  constructor(private readonly warningThresholdPercentage: number = 90) {}

  public evaluateMemory(
    usedMemoryBytes: number,
    maxMemoryBytes: number,
    evictionPolicy: 'noeviction' | 'allkeys-lru' | 'volatile-lru' | 'allkeys-lfu' | 'volatile-lfu',
    evictedKeysTotal: number = 0
  ): RedisMemoryStats {
    const usedMemoryPercentage = maxMemoryBytes > 0
      ? Number(((usedMemoryBytes / maxMemoryBytes) * 100).toFixed(2))
      : 0;

    const isNearingCapacity = usedMemoryPercentage >= this.warningThresholdPercentage;

    return {
      usedMemoryBytes,
      maxMemoryBytes,
      usedMemoryPercentage,
      evictionPolicy,
      evictedKeysTotal,
      isNearingCapacity
    };
  }

  public shouldTriggerAlert(stats: RedisMemoryStats): { alert: boolean; severity: 'CRITICAL' | 'WARNING' | 'OK'; message: string } {
    if (stats.usedMemoryPercentage >= 95) {
      return {
        alert: true,
        severity: 'CRITICAL',
        message: `Redis memory critical: ${stats.usedMemoryPercentage}% used under policy ${stats.evictionPolicy}`
      };
    }

    if (stats.usedMemoryPercentage >= this.warningThresholdPercentage) {
      return {
        alert: true,
        severity: 'WARNING',
        message: `Redis memory warning: ${stats.usedMemoryPercentage}% used exceeds threshold ${this.warningThresholdPercentage}%`
      };
    }

    return {
      alert: false,
      severity: 'OK',
      message: 'Redis memory is within operational boundaries'
    };
  }
}
