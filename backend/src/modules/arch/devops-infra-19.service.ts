/**
 * Architecture Service: CI Dependency License Auditor
 * Subsystem: Advanced DevOps & Infrastructure Automation [DEVOPS-INFRA-19]
 */

export interface PackageLicenseInfo {
  name: string;
  version: string;
  license: string;
}

export class DependencyLicenseAuditorService {
  private allowedLicenses: Set<string>;

  constructor(allowed?: string[]) {
    this.allowedLicenses = new Set(allowed || [
      'MIT',
      'Apache-2.0',
      'BSD-2-Clause',
      'BSD-3-Clause',
      'ISC',
      '0BSD',
      'CC0-1.0'
    ]);
  }

  public auditDependencies(packages: PackageLicenseInfo[]): { compliant: boolean; violations: PackageLicenseInfo[] } {
    const violations: PackageLicenseInfo[] = [];

    for (const pkg of packages) {
      if (!this.allowedLicenses.has(pkg.license)) {
        violations.push(pkg);
      }
    }

    return {
      compliant: violations.length === 0,
      violations
    };
  }

  public isAllowed(license: string): boolean {
    return this.allowedLicenses.has(license);
  }
}
