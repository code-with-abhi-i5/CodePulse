import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class SyntheticBrowserProbeService {
  executeSubmissionJourney(probeId) {
    const steps = [
      { stepName: 'load_editor_page', status: 'passed', durationMs: 45 },
      { stepName: 'authenticate_test_user', status: 'passed', durationMs: 60 },
      { stepName: 'insert_code_submission', status: 'passed', durationMs: 15 },
      { stepName: 'trigger_run_button', status: 'passed', durationMs: 30 },
      { stepName: 'await_test_verdict', status: 'passed', durationMs: 250 }
    ];
    const totalDurationMs = steps.reduce((acc, s) => acc + s.durationMs, 0);
    const success = steps.every(s => s.status === 'passed');
    return {
      probeId,
      journeyName: 'e2e_code_submission_flow',
      timestamp: new Date().toISOString(),
      success,
      totalDurationMs,
      steps
    };
  }

  validateProbeThreshold(run, maxAllowedDurationMs = 1000) {
    return run.success && run.totalDurationMs <= maxAllowedDurationMs;
  }
}

describe('SyntheticBrowserProbeService', () => {
  it('simulates end-to-end code submission probe and validates duration thresholds', () => {
    const probe = new SyntheticBrowserProbeService();
    const result = probe.executeSubmissionJourney('probe-e2e-run-001');

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.steps.length, 5);
    assert.ok(result.totalDurationMs > 0);
    assert.strictEqual(probe.validateProbeThreshold(result, 1000), true);
  });
});
