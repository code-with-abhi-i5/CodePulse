import test from 'node:test';
import assert from 'node:assert/strict';

class ChaosFaultInjectionRunner {
  evaluateAndRun(config, currentHourUtc, currentErrorRatePercent) {
    if (!config.allowedOffPeakHoursUtc.includes(currentHourUtc)) {
      return {
        experimentId: config.experimentId,
        executed: false,
        aborted: false,
        reason: `Current UTC hour ${currentHourUtc} is not within configured off-peak hours [${config.allowedOffPeakHoursUtc.join(',')}]`,
        simulatedDelayMs: 0
      };
    }

    if (currentErrorRatePercent > config.maxAllowedErrorRatePercent) {
      return {
        experimentId: config.experimentId,
        executed: false,
        aborted: true,
        reason: `Aborting chaos injection: system error rate ${currentErrorRatePercent}% exceeds safety threshold of ${config.maxAllowedErrorRatePercent}%`,
        simulatedDelayMs: 0
      };
    }

    const delay = config.faultType === 'latency' ? (config.magnitudeMs || 250) : 0;

    return {
      experimentId: config.experimentId,
      executed: true,
      aborted: false,
      simulatedDelayMs: delay
    };
  }
}

test('ChaosFaultInjectionRunner - enforces off-peak window and safety abort on budget exhaustion', () => {
  const runner = new ChaosFaultInjectionRunner();
  const config = {
    experimentId: 'EXP-LATENCY-001',
    targetService: 'user-profile-service',
    faultType: 'latency',
    magnitudeMs: 300,
    allowedOffPeakHoursUtc: [2, 3, 4],
    maxAllowedErrorRatePercent: 1.0
  };

  const peakRun = runner.evaluateAndRun(config, 14, 0.1);
  assert.strictEqual(peakRun.executed, false);
  assert.match(peakRun.reason, /not within configured off-peak/);

  const budgetAbort = runner.evaluateAndRun(config, 3, 2.5);
  assert.strictEqual(budgetAbort.aborted, true);
  assert.match(budgetAbort.reason, /Aborting chaos injection/);

  const successRun = runner.evaluateAndRun(config, 2, 0.2);
  assert.strictEqual(successRun.executed, true);
  assert.strictEqual(successRun.simulatedDelayMs, 300);
});
