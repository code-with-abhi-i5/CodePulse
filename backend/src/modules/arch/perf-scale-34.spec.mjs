import assert from 'node:assert/strict';
import { QueryPlanRegressionDetectorService } from './perf-scale-34.service.ts';

const detector = new QueryPlanRegressionDetectorService(2.0);

detector.recordBaseline('SELECT * FROM users WHERE email = ?', 50);

const eval1 = detector.evaluateQuery('SELECT * FROM users WHERE email = ?', 80);
assert.strictEqual(eval1.isRegression, false);

const eval2 = detector.evaluateQuery('SELECT * FROM users WHERE email = ?', 120);
assert.strictEqual(eval2.isRegression, true);
assert.strictEqual(eval2.alert.ratio, 2.4);

assert.strictEqual(detector.getRegressions().length, 1);
assert.strictEqual(detector.acknowledge('SELECT * FROM users WHERE email = ?'), true);

detector.updateBaselineAfterMigration('SELECT * FROM users WHERE email = ?', 120);
assert.strictEqual(detector.getRegressions().length, 0);

console.log('Issue #3069 [PERF-SCALE-34] spec passed successfully.');
