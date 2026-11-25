import assert from 'node:assert/strict';
import { CloudCostAnomalyAlertService } from './devops-infra-20.service.ts';

const monitor = new CloudCostAnomalyAlertService(1.5, 200);

monitor.recordHour(20, 10);
monitor.recordHour(22, 8);
monitor.recordHour(21, 9);

const alert1 = monitor.recordHour(25, 50);
assert.strictEqual(alert1.isAnomaly, true);
assert.ok(alert1.reason.includes('cost spike'));

const alert2 = monitor.recordHour(150, 100);
assert.strictEqual(alert2.isAnomaly, true);
assert.ok(alert2.reason.includes('Hard cap exceeded'));

console.log('Issue #3100 [DEVOPS-INFRA-20] spec passed successfully.');
