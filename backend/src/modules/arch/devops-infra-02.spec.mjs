import assert from 'node:assert/strict';
import { CanaryRollbackDetectorService } from './devops-infra-02.service.ts';

const detector = new CanaryRollbackDetectorService(0.02, 2.0);

const stable = { totalRequests: 1000, errorRequests: 5, p99LatencyMs: 100 };
const healthyCanary = { totalRequests: 500, errorRequests: 4, p99LatencyMs: 110 };

const d1 = detector.evaluateCanary(stable, healthyCanary);
assert.strictEqual(d1.shouldRollback, false);

const spikedCanary = { totalRequests: 500, errorRequests: 25, p99LatencyMs: 120 };
const d2 = detector.evaluateCanary(stable, spikedCanary);
assert.strictEqual(d2.shouldRollback, true);
assert.ok(d2.reason.includes('Error rate spike'));

console.log('Issue #3082 [DEVOPS-INFRA-02] spec passed successfully.');
