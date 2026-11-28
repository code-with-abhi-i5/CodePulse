import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class SqliLexicalScannerService {
  constructor() {
    this.suspiciousPatterns = [
      /(--|#|\/\*)/,
      /(\bUNION\s+ALL\s+SELECT\b|\bUNION\s+SELECT\b)/i,
      /(\bOR\s+1\s*=\s*1\b|\bOR\s+'a'\s*=\s*'a'\b)/i,
      /(\bDROP\s+TABLE\b|\bTRUNCATE\s+TABLE\b)/i,
      /(;\s*SELECT|;\s*UPDATE|;\s*DELETE)/i
    ];
  }

  scanFragment(sqlFragment) {
    const detectedPatterns = [];

    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(sqlFragment)) {
        detectedPatterns.push(pattern.source);
      }
    }

    const hasInjection = detectedPatterns.length > 0;
    let riskLevel = 'NONE';

    if (hasInjection) {
      riskLevel = detectedPatterns.some(p => p.includes('DROP') || p.includes('UNION'))
        ? 'CRITICAL'
        : 'HIGH';
    }

    return {
      hasInjection,
      detectedPatterns,
      riskLevel
    };
  }
}

describe('SqliLexicalScannerService', () => {
  const scanner = new SqliLexicalScannerService();

  it('detects critical SQL injection containing UNION SELECT and DROP TABLE', () => {
    const res = scanner.scanFragment("1' UNION SELECT username, password FROM users --");
    assert.equal(res.hasInjection, true);
    assert.equal(res.riskLevel, 'CRITICAL');
  });

  it('detects boolean tautology injections (OR 1=1)', () => {
    const res = scanner.scanFragment("admin' OR 1=1 --");
    assert.equal(res.hasInjection, true);
    assert.equal(res.riskLevel, 'HIGH');
  });

  it('approves clean parameterized fragments', () => {
    const res = scanner.scanFragment('WHERE "user_id" = $1 AND "status" = $2');
    assert.equal(res.hasInjection, false);
    assert.equal(res.riskLevel, 'NONE');
  });
});
