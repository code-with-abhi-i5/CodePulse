import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class SqlTaintAnalyzerService {
  constructor() {
    this.injectionPatterns = [
      /(\bOR\b|\bAND\b)\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i,
      /\bUNION\s+(ALL\s+)?SELECT\b/i,
      /--|\/\*|\*\//,
      /;\s*(DROP|DELETE|UPDATE|INSERT)\b/i,
      /\bSLEEP\s*\(\s*\d+\s*\)/i,
      /\bBENCHMARK\s*\(/i,
    ];
  }

  detectSqlInjection(input) {
    if (typeof input !== 'string') return false;
    return this.injectionPatterns.some(p => p.test(input));
  }

  analyzeParameters(params) {
    const violations = [];
    const entries = Array.isArray(params) ? params : Object.values(params);
    for (const val of entries) {
      if (typeof val === 'string' && this.detectSqlInjection(val)) {
        violations.push(val);
      }
    }
    return { isTainted: violations.length > 0, violations };
  }
}

describe('SqlTaintAnalyzerService', () => {
  it('flags tainted inputs containing SQL injection signatures', () => {
    const service = new SqlTaintAnalyzerService();
    const bad = service.analyzeParameters({ id: "105 OR 1=1" });
    assert.equal(bad.isTainted, true);

    const good = service.analyzeParameters({ id: "105", sort: "desc" });
    assert.equal(good.isTainted, false);
  });
});
