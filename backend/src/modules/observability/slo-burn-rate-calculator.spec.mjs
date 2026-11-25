import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class SloBurnRateCalculatorService {
  calculateBurnRate(config, totalRequests, errorRequests) {
    if (totalRequests === 0) {
      return {
        serviceName: config.serviceName,
        sliName: config.sliName,
        burnRate: 0,
        budgetConsumedPercent: 0,
        timeToExhaustionHours: Infinity,
        severity: 'normal',
        triggered: false
      };
    }
    const actualErrorRate = errorRequests / totalRequests;
    const allowedErrorRate = 1 - config.sloTarget;
    const burnRate = allowedErrorRate > 0 ? actualErrorRate / allowedErrorRate : 0;
    const budgetConsumedPercent = parseFloat(((burnRate * (config.windowMinutes / 60)) / 720 * 100).toFixed(2));
    const timeToExhaustionHours = burnRate > 0 ? parseFloat((720 / burnRate).toFixed(1)) : Infinity;
    let severity = 'normal';
    let triggered = false;
    if (burnRate >= 14.4) {
      severity = 'critical';
      triggered = true;
    } else if (burnRate >= 6.0) {
      severity = 'warning';
      triggered = true;
    }
    return {
      serviceName: config.serviceName,
      sliName: config.sliName,
      burnRate: parseFloat(burnRate.toFixed(2)),
      budgetConsumedPercent,
      timeToExhaustionHours,
      severity,
      triggered
    };
  }
}

describe('SloBurnRateCalculatorService', () => {
  it('triggers critical alert when error rate burn exceeds 14.4x in 1hr window', () => {
    const calc = new SloBurnRateCalculatorService();
    const alert = calc.calculateBurnRate(
      {
        serviceName: 'execution-engine',
        sliName: 'submission_success_rate',
        sloTarget: 0.999,
        windowMinutes: 60
      },
      10000,
      150
    );

    assert.strictEqual(alert.triggered, true);
    assert.strictEqual(alert.severity, 'critical');
    assert.ok(alert.burnRate >= 14.4);
    assert.ok(alert.timeToExhaustionHours <= 50);
  });
});
