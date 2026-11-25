/**
 * Architecture Service: Redis Memory Eviction Policy Analyzer
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-26]
 */

export type MemoryAlertLevel = 'OK' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';

export interface RedisMemoryStats {
  usedBytes: number;
  maxBytes: number;
  evictedKeysTotal: number;
  currentPolicy: string;
}

export class RedisMemoryEvictionAnalyzerService {
  public analyzeMemory(stats: RedisMemoryStats): { utilizationPercent: number; alertLevel: MemoryAlertLevel; recommendedPolicy?: string } {
    if (stats.maxBytes === 0) {
      return { utilizationPercent: 0, alertLevel: 'OK' };
    }

    const utilizationPercent = Math.round((stats.usedBytes / stats.maxBytes) * 100);
    let alertLevel: MemoryAlertLevel = 'OK';

    if (utilizationPercent >= 95) {
      alertLevel = 'EMERGENCY';
    } else if (utilizationPercent >= 85) {
      alertLevel = 'CRITICAL';
    } else if (utilizationPercent >= 75) {
      alertLevel = 'WARNING';
    }

    let recommendedPolicy: string | undefined = undefined;
    if (stats.currentPolicy === 'noeviction' && utilizationPercent >= 75) {
      recommendedPolicy = 'allkeys-lru';
    }

    return {
      utilizationPercent,
      alertLevel,
      recommendedPolicy
    };
  }
}
