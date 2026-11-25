import assert from 'node:assert/strict';
import { HpaCustomMetricsAdapterService } from './devops-infra-03.service.ts';

const adapter = new HpaCustomMetricsAdapterService({
  targetConnectionsPerPod: 1000,
  minReplicas: 2,
  maxReplicas: 10
});

const d1 = adapter.computeDesiredReplicas(5500, 2);
assert.strictEqual(d1.desiredReplicas, 6);
assert.strictEqual(d1.scaleAction, 'SCALE_UP');

const d2 = adapter.computeDesiredReplicas(200, 6);
assert.strictEqual(d2.desiredReplicas, 2);
assert.strictEqual(d2.scaleAction, 'SCALE_DOWN');

console.log('Issue #3083 [DEVOPS-INFRA-03] spec passed successfully.');
