import assert from 'node:assert/strict';
import { DockerTrivyScannerService } from './devops-infra-06.service.ts';

const scanner = new DockerTrivyScannerService(['CRITICAL', 'HIGH']);

const cleanScan = scanner.evaluateScan('codepulse-backend:latest', [
  { vulnerabilityId: 'CVE-2024-001', pkgName: 'libssl', installedVersion: '3.0.1', severity: 'LOW' }
]);
assert.strictEqual(cleanScan.passed, true);
assert.strictEqual(cleanScan.blockingVulnerabilities.length, 0);

const vulnerableScan = scanner.evaluateScan('codepulse-backend:vulnerable', [
  { vulnerabilityId: 'CVE-2024-999', pkgName: 'openssl', installedVersion: '1.1.1', severity: 'CRITICAL' },
  { vulnerabilityId: 'CVE-2024-888', pkgName: 'curl', installedVersion: '7.8.0', severity: 'HIGH' }
]);
assert.strictEqual(vulnerableScan.passed, false);
assert.strictEqual(vulnerableScan.criticalCount, 1);
assert.strictEqual(vulnerableScan.highCount, 1);
assert.strictEqual(vulnerableScan.blockingVulnerabilities.length, 2);

console.log('Issue #3086 [DEVOPS-INFRA-06] spec passed successfully.');
