import assert from 'node:assert/strict';
import { K8sProbeCalibratorService } from './devops-infra-23.service.ts';

const calibrator = new K8sProbeCalibratorService();

const probes = calibrator.calibrateProbes(20);
assert.strictEqual(probes.startupProbe.failureThreshold, 6);
assert.strictEqual(probes.startupProbe.periodSeconds, 5);
assert.strictEqual(probes.readinessProbe.failureThreshold, 3);

console.log('Issue #3103 [DEVOPS-INFRA-23] spec passed successfully.');
