import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TestRunnerDiffVisualizerService } from './fe-ui-47.service.ts';

describe('TestRunnerDiffVisualizerService (FE-UI-47)', () => {
  it('calculates test suite summary and pass rate accurately', () => {
    const viz = new TestRunnerDiffVisualizerService();
    viz.recordTest({ id: 't1', name: 'Add two numbers', passed: true, durationMs: 12 });
    viz.recordTest({ id: 't2', name: 'Divide by zero', passed: false, durationMs: 18, expected: 'Infinity', actual: 'NaN' });

    const summary = viz.computeSummary();
    assert.strictEqual(summary.total, 2);
    assert.strictEqual(summary.passed, 1);
    assert.strictEqual(summary.failed, 1);
    assert.strictEqual(summary.passRate, 50);
  });

  it('generates line diffs highlighting additions and removals', () => {
    const viz = new TestRunnerDiffVisualizerService();
    const diff = viz.generateDiff('line1\nline2', 'line1\nline3');
    assert.strictEqual(diff.length, 3);
    assert.strictEqual(diff[0].type, 'same');
    assert.strictEqual(diff[1].type, 'removed');
    assert.strictEqual(diff[2].type, 'added');
  });
});
