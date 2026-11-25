import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FrontendPerformanceObserverService } from './fe-ui-37.service.ts';

describe('FrontendPerformanceObserverService (FE-UI-37)', () => {
  it('classifies web vitals ratings accurately', () => {
    const obs = new FrontendPerformanceObserverService();
    const lcpGood = obs.recordMetric('LCP', 1800);
    assert.strictEqual(lcpGood.rating, 'good');

    const lcpPoor = obs.recordMetric('LCP', 4500);
    assert.strictEqual(lcpPoor.rating, 'poor');

    const clsNeedsImp = obs.recordMetric('CLS', 0.15);
    assert.strictEqual(clsNeedsImp.rating, 'needs-improvement');
  });

  it('calculates interaction percentiles and report', () => {
    const obs = new FrontendPerformanceObserverService();
    for (let i = 1; i <= 100; i++) {
      obs.recordInteraction(i * 5);
    }
    const report = obs.generateReport();
    assert.strictEqual(report.interactionPercentiles.count, 100);
    assert.ok(report.interactionPercentiles.p75 > 0);
    assert.ok(report.interactionPercentiles.p95 >= report.interactionPercentiles.p75);
    assert.ok(report.vitals['INP'] !== undefined);
  });
});
