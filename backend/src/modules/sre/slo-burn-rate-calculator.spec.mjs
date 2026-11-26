import test from 'node:test';
import assert from 'node:assert/strict';

class SloBurnRateCalculator {
  evaluateBurnRate(sloName, targetAvailabilityPercent, metric1h, metric6h) {
    const allowedErrorBudgetRate = (100 - targetAvailabilityPercent) / 100;
    const errorRate1h = metric1h.totalRequests > 0 ? (metric1h.failedRequests / metric1h.totalRequests) : 0;
    const errorRate6h = metric6h.totalRequests > 0 ? (metric6h.failedRequests / metric6h.totalRequests) : 0;

    const burnRate1h = Math.round((errorRate1h / allowedErrorBudgetRate) * 100) / 100;
    const burnRate6h = Math.round((errorRate6h / allowedErrorBudgetRate) * 100) / 100;

    let triggerPage = false;
    let triggerTicket = false;
    let severity = 'none';
    let reason = 'SLO error budget burn rate is within safe operating margins';

    if (burnRate1h >= 14.4 || burnRate6h >= 6.0) {
      triggerPage = true;
      severity = 'page';
      reason = `Critical burn rate: 1h burn rate is ${burnRate1h}x, 6h burn rate is ${burnRate6h}x`;
    } else if (burnRate1h >= 3.0 || burnRate6h >= 3.0) {
      triggerTicket = true;
      severity = 'ticket';
      reason = `Elevated burn rate: 1h burn rate is ${burnRate1h}x, 6h burn rate is ${burnRate6h}x`;
    }

    return {
      sloName,
      burnRate1h,
      burnRate6h,
      triggerPage,
      triggerTicket,
      severity,
      reason
    };
  }
}

test('SloBurnRateCalculator - triggers pager alarms on rapid multi-window budget depletion', () => {
  const calc = new SloBurnRateCalculator();

  // 99.9% availability SLO (allowed error rate = 0.001)
  const safe = calc.evaluateBurnRate(
    'battle-submission-slo',
    99.9,
    { windowMinutes: 60, totalRequests: 10000, failedRequests: 1, errorRate: 0.0001 },
    { windowMinutes: 360, totalRequests: 60000, failedRequests: 6, errorRate: 0.0001 }
  );
  assert.strictEqual(safe.severity, 'none');
  assert.strictEqual(safe.triggerPage, false);

  // Critical 1h surge (20 failures per 1000 -> 0.02 error rate -> 20x burn rate)
  const critical = calc.evaluateBurnRate(
    'battle-submission-slo',
    99.9,
    { windowMinutes: 60, totalRequests: 1000, failedRequests: 20, errorRate: 0.02 },
    { windowMinutes: 360, totalRequests: 6000, failedRequests: 40, errorRate: 0.0067 }
  );
  assert.strictEqual(critical.severity, 'page');
  assert.strictEqual(critical.triggerPage, true);
});
