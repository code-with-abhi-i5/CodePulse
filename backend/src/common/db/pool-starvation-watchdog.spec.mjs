import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class PoolStarvationWatchdogService {
  constructor(minPoolLimit = 10, maxPoolLimit = 100, scaleStep = 10) {
    this.minPoolLimit = minPoolLimit;
    this.maxPoolLimit = maxPoolLimit;
    this.scaleStep = scaleStep;
  }

  evaluatePoolStatus(currentActive, currentMax, queueLength) {
    const saturation = currentMax > 0 ? (currentActive / currentMax) : 0;

    if (saturation >= 0.85 || queueLength > 5) {
      if (currentMax < this.maxPoolLimit) {
        const recommendedMax = Math.min(currentMax + this.scaleStep, this.maxPoolLimit);
        return {
          currentActive,
          currentMax,
          queueLength,
          recommendedMax,
          action: 'SCALE_UP',
          reason: 'Pool saturation ' + (saturation * 100).toFixed(1) + '% or queue length ' + queueLength + ' demands scaling up'
        };
      }
    } else if (saturation < 0.25 && queueLength === 0 && currentMax > this.minPoolLimit) {
      const recommendedMax = Math.max(currentMax - this.scaleStep, this.minPoolLimit);
      return {
        currentActive,
        currentMax,
        queueLength,
        recommendedMax,
        action: 'SCALE_DOWN',
        reason: 'Pool utilization under 25% with zero waiting queue'
      };
    }

    return {
      currentActive,
      currentMax,
      queueLength,
      recommendedMax: currentMax,
      action: 'NO_OP',
      reason: 'Pool operating within optimal saturation parameters'
    };
  }
}

describe('PoolStarvationWatchdogService', () => {
  const watchdog = new PoolStarvationWatchdogService(10, 50, 10);

  it('triggers scale up when active connections saturate pool', () => {
    const dec = watchdog.evaluatePoolStatus(18, 20, 2);
    assert.equal(dec.action, 'SCALE_UP');
    assert.equal(dec.recommendedMax, 30);
  });

  it('triggers scale up when queue backlog builds up', () => {
    const dec = watchdog.evaluatePoolStatus(10, 20, 8);
    assert.equal(dec.action, 'SCALE_UP');
    assert.equal(dec.recommendedMax, 30);
  });

  it('triggers scale down when pool is idle', () => {
    const dec = watchdog.evaluatePoolStatus(4, 40, 0);
    assert.equal(dec.action, 'SCALE_DOWN');
    assert.equal(dec.recommendedMax, 30);
  });

  it('returns NO_OP when already at bounds or operating normally', () => {
    const dec = watchdog.evaluatePoolStatus(50, 50, 10);
    assert.equal(dec.action, 'NO_OP');
  });
});
