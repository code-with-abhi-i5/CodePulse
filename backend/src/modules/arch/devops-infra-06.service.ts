/**
 * Architecture Service: Docker Trivy Vulnerability Scanner
 * Subsystem: Advanced DevOps & Infrastructure Automation [DEVOPS-INFRA-06]
 */

export interface VulnerabilityRecord {
  vulnerabilityId: string;
  pkgName: string;
  installedVersion: string;
  fixedVersion?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ScanResult {
  imageTag: string;
  passed: boolean;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  blockingVulnerabilities: VulnerabilityRecord[];
}

export class DockerTrivyScannerService {
  private blockSeverities: Set<string>;

  constructor(blockSeverities: string[] = ['CRITICAL', 'HIGH']) {
    this.blockSeverities = new Set(blockSeverities);
  }

  public evaluateScan(imageTag: string, vulnerabilities: VulnerabilityRecord[]): ScanResult {
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    const blocking: VulnerabilityRecord[] = [];

    for (const v of vulnerabilities) {
      if (v.severity === 'CRITICAL') criticalCount++;
      else if (v.severity === 'HIGH') highCount++;
      else if (v.severity === 'MEDIUM') mediumCount++;
      else if (v.severity === 'LOW') lowCount++;

      if (this.blockSeverities.has(v.severity)) {
        blocking.push(v);
      }
    }

    return {
      imageTag,
      passed: blocking.length === 0,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      blockingVulnerabilities: blocking
    };
  }
}
