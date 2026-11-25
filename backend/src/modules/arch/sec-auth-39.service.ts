/**
 * Architecture Service: Automated Dependency Vulnerability Scanner
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-39]
 */

export interface CveAdvisory {
  packageName: string;
  vulnerableVersions: string[];
  cveId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class DependencyVulnerabilityScannerService {
  public scanDependencies(
    dependencies: Record<string, string>,
    advisories: CveAdvisory[]
  ): { hasCriticalIssues: boolean; matchedCves: CveAdvisory[] } {
    const matchedCves: CveAdvisory[] = [];

    for (const adv of advisories) {
      const installedVersion = dependencies[adv.packageName];
      if (installedVersion && adv.vulnerableVersions.includes(installedVersion)) {
        matchedCves.push(adv);
      }
    }

    const hasCriticalIssues = matchedCves.some((c) => c.severity === 'CRITICAL' || c.severity === 'HIGH');
    return { hasCriticalIssues, matchedCves };
  }
}
