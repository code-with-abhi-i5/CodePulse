import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DependencyVulnerabilityScannerService } from './sec-auth-39.service.ts';

describe('DependencyVulnerabilityScannerService (SEC-AUTH-39)', () => {
  it('scans dependency manifests against CVE advisory feeds and flags critical issues', () => {
    const scanner = new DependencyVulnerabilityScannerService();
    const manifest = {
      express: '4.17.1',
      lodash: '4.17.20'
    };
    const advisories = [
      { packageName: 'lodash', vulnerableVersions: ['4.17.20'], cveId: 'CVE-2021-23337', severity: 'HIGH' }
    ];

    const result = scanner.scanDependencies(manifest, advisories);
    assert.strictEqual(result.hasCriticalIssues, true);
    assert.strictEqual(result.matchedCves.length, 1);
    assert.strictEqual(result.matchedCves[0].cveId, 'CVE-2021-23337');
  });
});
