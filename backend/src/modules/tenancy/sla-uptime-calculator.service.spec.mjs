import test from 'node:test';
import assert from 'node:assert/strict';

class SlaUptimeCalculator {
  evaluateMonthlySla(tenantId, month, totalMinutesInMonth, downtimeMinutes) {
    if (totalMinutesInMonth <= 0) throw new Error('totalMinutesInMonth must be positive');
    const uptimeMinutes = Math.max(0, totalMinutesInMonth - downtimeMinutes);
    const uptimePercentage = Number(((uptimeMinutes / totalMinutesInMonth) * 100).toFixed(4));
    const slaMet = uptimePercentage >= 99.9;
    
    let penaltyCreditPercent = 0;
    if (uptimePercentage < 95.0) {
      penaltyCreditPercent = 50;
    } else if (uptimePercentage < 99.0) {
      penaltyCreditPercent = 25;
    } else if (uptimePercentage < 99.9) {
      penaltyCreditPercent = 10;
    }

    return {
      tenantId,
      month,
      uptimePercentage,
      slaMet,
      downtimeMinutes,
      penaltyCreditPercent
    };
  }
}

test('SlaUptimeCalculator - calculates SLA uptime % and penalty credits accurately', () => {
  const calc = new SlaUptimeCalculator();
  const res999 = calc.evaluateMonthlySla('t1', '2026-11', 43200, 30);
  assert.strictEqual(res999.slaMet, true);
  assert.strictEqual(res999.penaltyCreditPercent, 0);

  const resBreached = calc.evaluateMonthlySla('t1', '2026-11', 43200, 45);
  assert.strictEqual(resBreached.slaMet, false);
  assert.strictEqual(resBreached.penaltyCreditPercent, 10);
});
