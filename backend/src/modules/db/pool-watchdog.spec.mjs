import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class PoolWatchdogService {
  constructor() {
    this.activeConnections = 0;
    this.maxPoolSize = 50;
  }

  recordUsage(active, max) {
    this.activeConnections = active;
    this.maxPoolSize = max;
  }

  getPoolHealth() {
    const ratio = this.maxPoolSize > 0 ? this.activeConnections / this.maxPoolSize : 0;
    let status = 'healthy';
    if (ratio >= 0.9) status = 'critical';
    else if (ratio >= 0.75) status = 'degraded';
    return {
      active: this.activeConnections,
      max: this.maxPoolSize,
      utilizationRatio: ratio,
      status,
    };
  }

  shouldShed(priority, utilizationRatio) {
    if (utilizationRatio >= 0.9) {
      return priority !== 'high';
    }
    if (utilizationRatio >= 0.8) {
      return priority === 'low';
    }
    return false;
  }
}

describe('PoolWatchdogService', () => {
  it('detects connection pool starvation and sheds analytical queries', () => {
    const service = new PoolWatchdogService();
    service.recordUsage(42, 50); // 84%
    const health = service.getPoolHealth();
    assert.equal(health.status, 'degraded');
    assert.equal(service.shouldShed('low', health.utilizationRatio), true);
    assert.equal(service.shouldShed('normal', health.utilizationRatio), false);

    service.recordUsage(48, 50); // 96%
    assert.equal(service.shouldShed('normal', 0.96), true);
    assert.equal(service.shouldShed('high', 0.96), false);
  });
});
