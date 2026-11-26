import { DirtyPageStats, PageCacheGovernanceDecision } from '../../types/sre';

export class PageCacheEvictionGovernor {
  private syncThresholdPercent: number;

  constructor(syncThresholdPercent: number = 20.0) {
    this.syncThresholdPercent = syncThresholdPercent;
  }

  govern(stats: DirtyPageStats): PageCacheGovernanceDecision {
    if (stats.dirtyRatioPercent >= this.syncThresholdPercent) {
      return {
        triggerSync: true,
        throttleWriteback: true,
        reason: `Dirty page ratio ${stats.dirtyRatioPercent}% exceeded threshold ${this.syncThresholdPercent}%`
      };
    }
    return {
      triggerSync: false,
      throttleWriteback: false
    };
  }
}
