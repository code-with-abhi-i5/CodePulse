import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class RedisMemoryEvictionMonitorService {
  constructor(warningThresholdPercentage = 90) {
    this.warningThresholdPercentage = warningThresholdPercentage;
  }

  evaluateMemory(usedMemoryBytes, maxMemoryBytes, evictionPolicy, evictedKeysTotal = 0) {
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

  shouldTriggerAlert(stats) {
    if (stats.usedMemoryPercentage >= 95) {
      return {
        alert: true,
        severity: 'CRITICAL',
        message: 'Redis memory critical: ' + stats.usedMemoryPercentage + '% used under policy ' + stats.evictionPolicy
      };
    }

    if (stats.usedMemoryPercentage >= this.warningThresholdPercentage) {
      return {
        alert: true,
        severity: 'WARNING',
        message: 'Redis memory warning: ' + stats.usedMemoryPercentage + '% used exceeds threshold ' + this.warningThresholdPercentage + '%'
      };
    }

    return {
      alert: false,
      severity: 'OK',
      message: 'Redis memory is within operational boundaries'
    };
  }
}

describe('RedisMemoryEvictionMonitorService', () => {
  const service = new RedisMemoryEvictionMonitorService(90);

  it('evaluates memory percentages correctly', () => {
    const stats = service.evaluateMemory(9200, 10000, 'allkeys-lru', 15);
    assert.equal(stats.usedMemoryPercentage, 92);
    assert.equal(stats.isNearingCapacity, true);

    const zeroMax = service.evaluateMemory(100, 0, 'noeviction');
    assert.equal(zeroMax.usedMemoryPercentage, 0);
    assert.equal(zeroMax.isNearingCapacity, false);
  });

  it('triggers critical and warning alerts based on thresholds', () => {
    const criticalStats = service.evaluateMemory(9600, 10000, 'volatile-lru');
    const alertCrit = service.shouldTriggerAlert(criticalStats);
    assert.equal(alertCrit.severity, 'CRITICAL');
    assert.equal(alertCrit.alert, true);

    const warningStats = service.evaluateMemory(9100, 10000, 'allkeys-lru');
    const alertWarn = service.shouldTriggerAlert(warningStats);
    assert.equal(alertWarn.severity, 'WARNING');
    assert.equal(alertWarn.alert, true);

    const okStats = service.evaluateMemory(5000, 10000, 'allkeys-lru');
    const alertOk = service.shouldTriggerAlert(okStats);
    assert.equal(alertOk.severity, 'OK');
    assert.equal(alertOk.alert, false);
  });
});
