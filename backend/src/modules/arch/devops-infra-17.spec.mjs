import assert from 'node:assert/strict';
import { PrometheusAlertValidatorService } from './devops-infra-17.service.ts';

const validator = new PrometheusAlertValidatorService();

const validRule = {
  alert: 'HighHttpErrorRate',
  expr: 'rate(http_requests_total{status=~"5.."}[5m]) > 0.05',
  forDuration: '5m',
  labels: { severity: 'critical' },
  annotations: { summary: 'HTTP 5xx rate exceeded 5%' }
};

const res = validator.validateRuleSyntax(validRule);
assert.strictEqual(res.isValid, true);
assert.strictEqual(res.errors.length, 0);

assert.strictEqual(validator.evaluateThreshold(validRule.expr, 0.08), true);
assert.strictEqual(validator.evaluateThreshold(validRule.expr, 0.02), false);

console.log('Issue #3097 [DEVOPS-INFRA-17] spec passed successfully.');
