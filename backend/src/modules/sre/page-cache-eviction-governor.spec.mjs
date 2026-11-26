import test from 'node:test';
import assert from 'node:assert/strict';

class PageCacheEvictionGovernor {
  constructor(syncThresholdPercent = 20.0) {
    this.syncThresholdPercent = syncThresholdPercent;
  }

  govern(stats) {
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

test('PageCacheEvictionGovernor - triggers background flush when dirty page ratio breaches limits', () => {
  const gov = new PageCacheEvictionGovernor(20.0);
  const ok = gov.govern({ dirtyBytes: 1000, totalMemoryBytes: 10000, dirtyRatioPercent: 10.0 });
  assert.strictEqual(ok.triggerSync, false);

  const alert = gov.govern({ dirtyBytes: 2500, totalMemoryBytes: 10000, dirtyRatioPercent: 25.0 });
  assert.strictEqual(alert.triggerSync, true);
  assert.strictEqual(alert.throttleWriteback, true);
});
