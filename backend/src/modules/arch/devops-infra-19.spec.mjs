import assert from 'node:assert/strict';
import { DependencyLicenseAuditorService } from './devops-infra-19.service.ts';

const auditor = new DependencyLicenseAuditorService();

const pkgs = [
  { name: 'express', version: '4.18.2', license: 'MIT' },
  { name: 'lodash', version: '4.17.21', license: 'MIT' },
  { name: 'restrictive-pkg', version: '1.0.0', license: 'GPL-3.0' }
];

const audit = auditor.auditDependencies(pkgs);
assert.strictEqual(audit.compliant, false);
assert.strictEqual(audit.violations.length, 1);
assert.strictEqual(audit.violations[0].name, 'restrictive-pkg');

console.log('Issue #3099 [DEVOPS-INFRA-19] spec passed successfully.');
