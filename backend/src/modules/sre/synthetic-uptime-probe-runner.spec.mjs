import test from 'node:test';
import assert from 'node:assert/strict';

class SyntheticUptimeProbeRunner {
  constructor() {
    this.probeHistory = [];
  }

  async executeSyntheticBattleSubmission(probeId, region, shouldFailStep = false) {
    const steps = [
      { stepName: 'auth_session_init', durationMs: 15, success: true },
      { stepName: 'fetch_challenge', durationMs: 25, success: true },
      { stepName: 'code_execution_submit', durationMs: 120, success: !shouldFailStep },
      { stepName: 'verdict_assert_pass', durationMs: 40, success: !shouldFailStep }
    ];

    const result = {
      probeId,
      targetRegion: region,
      totalDurationMs: 200,
      success: steps.every(s => s.success),
      steps,
      timestamp: Date.now()
    };

    this.probeHistory.push(result);
    return result;
  }

  getAvailabilityPercent() {
    if (this.probeHistory.length === 0) return 100.0;
    const successes = this.probeHistory.filter(p => p.success).length;
    return Math.round((successes / this.probeHistory.length) * 10000) / 100;
  }

  reset() {
    this.probeHistory = [];
  }
}

test('SyntheticUptimeProbeRunner - executes synthetic end-to-end battle submission', async () => {
  const runner = new SyntheticUptimeProbeRunner();
  assert.strictEqual(runner.getAvailabilityPercent(), 100.0);

  const res = await runner.executeSyntheticBattleSubmission('probe-01', 'us-east-1');
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.steps.length, 4);
  assert.strictEqual(runner.getAvailabilityPercent(), 100.0);

  await runner.executeSyntheticBattleSubmission('probe-02', 'us-east-1', true);
  assert.strictEqual(runner.getAvailabilityPercent(), 50.0);

  runner.reset();
  assert.strictEqual(runner.getAvailabilityPercent(), 100.0);
});
