import { Injectable, Logger } from '@nestjs/common';
import { SecurityScanFinding } from '../../../src/types/backend';

export interface SecurityScanResult {
  passed: boolean;
  riskScore: number;
  findings: SecurityScanFinding[];
}

@Injectable()
export class AstSecurityScanService {
  private readonly logger = new Logger(AstSecurityScanService.name);
  private disallowedPatterns = [
    { pattern: /child_process/i, ruleId: 'NO_CHILD_PROCESS', severity: 'CRITICAL' as const, message: 'Process spawning is forbidden' },
    { pattern: /execSync|spawnSync|fork/i, ruleId: 'NO_SHELL_EXEC', severity: 'CRITICAL' as const, message: 'Synchronous execution is forbidden' },
    { pattern: /fs\.(writeFile|rm|unlink)/i, ruleId: 'NO_FILESYSTEM_MUTATION', severity: 'HIGH' as const, message: 'Filesystem mutation is forbidden' },
    { pattern: /net\.|dgram\.|tls\./i, ruleId: 'NO_RAW_SOCKETS', severity: 'HIGH' as const, message: 'Raw socket creation is forbidden' }
  ];

  public evaluateSecurityRisk(code: string, lang: string): SecurityScanResult {
    const findings: SecurityScanFinding[] = [];
    const lines = code.split('\n');

    lines.forEach((lineText, idx) => {
      this.disallowedPatterns.forEach(rule => {
        if (rule.pattern.test(lineText)) {
          findings.push({
            ruleId: rule.ruleId,
            severity: rule.severity,
            message: rule.message,
            line: idx + 1
          });
        }
      });
    });

    const hasCritical = findings.some(f => f.severity === 'CRITICAL');
    const riskScore = findings.reduce((acc, curr) => acc + (curr.severity === 'CRITICAL' ? 50 : 20), 0);

    return {
      passed: !hasCritical && riskScore < 50,
      riskScore: Math.min(100, riskScore),
      findings
    };
  }

  public detectProcessSpawns(code: string): boolean {
    return /child_process|execSync|spawn/i.test(code);
  }
}
