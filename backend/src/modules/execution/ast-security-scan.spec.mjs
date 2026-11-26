import assert from 'node:assert/strict';
import test from 'node:test';

class AstSecurityScanService {
  constructor() {
    this.disallowedPatterns = [
      { pattern: /child_process/i, ruleId: 'NO_CHILD_PROCESS', severity: 'CRITICAL' },
      { pattern: /execSync|spawnSync/i, ruleId: 'NO_SHELL_EXEC', severity: 'CRITICAL' },
      { pattern: /fs\.(writeFile|rm|unlink)/i, ruleId: 'NO_FS_MUTATION', severity: 'HIGH' }
    ];
  }

  evaluateSecurityRisk(code, lang) {
    const findings = [];
    const lines = code.split('\n');
    lines.forEach((lineText, idx) => {
      this.disallowedPatterns.forEach(rule => {
        if (rule.pattern.test(lineText)) {
          findings.push({ ruleId: rule.ruleId, severity: rule.severity, line: idx + 1 });
        }
      });
    });
    const hasCritical = findings.some(f => f.severity === 'CRITICAL');
    return { passed: !hasCritical, riskScore: findings.length * 50, findings };
  }

  detectProcessSpawns(code) {
    return /child_process|execSync|spawn/i.test(code);
  }
}

test('AstSecurityScanService: detects process spawning and rejects malicious code', () => {
  const scanner = new AstSecurityScanService();
  const safeCode = 'const sum = (a, b) => a + b;';
  const cleanResult = scanner.evaluateSecurityRisk(safeCode, 'typescript');
  assert.equal(cleanResult.passed, true);
  assert.equal(cleanResult.findings.length, 0);

  const maliciousCode = 'const cp = require("child_process"); cp.execSync("rm -rf /");';
  const badResult = scanner.evaluateSecurityRisk(maliciousCode, 'typescript');
  assert.equal(badResult.passed, false);
  assert.ok(badResult.findings.some(f => f.ruleId === 'NO_CHILD_PROCESS'));
});
