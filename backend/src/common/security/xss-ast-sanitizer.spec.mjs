import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class XssAstSanitizerService {
  constructor() {
    this.dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /\bon\w+\s*=/gi,
      /eval\s*\(/gi,
      /document\.cookie/gi
    ];
  }

  sanitizeCode(input) {
    const detectedThreats = [];
    let sanitizedCode = input;

    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(input)) {
        detectedThreats.push(pattern.source);
        sanitizedCode = sanitizedCode.replace(pattern, '/* BLOCKED_XSS */');
      }
    }

    return {
      isClean: detectedThreats.length === 0,
      detectedThreats,
      sanitizedCode
    };
  }
}

describe('XssAstSanitizerService', () => {
  const sanitizer = new XssAstSanitizerService();

  it('detects and neutralizes inline script tags and event handlers', () => {
    const payload = '<img src=x onerror=alert(1)><script>steal(document.cookie)</script>';
    const result = sanitizer.sanitizeCode(payload);

    assert.equal(result.isClean, false);
    assert.ok(!result.sanitizedCode.includes('<script>'));
    assert.ok(result.sanitizedCode.includes('/* BLOCKED_XSS */'));
  });

  it('passes clean algorithm solutions without modification', () => {
    const code = 'function twoSum(nums, target) { return [0, 1]; }';
    const result = sanitizer.sanitizeCode(code);
    assert.equal(result.isClean, true);
    assert.equal(result.sanitizedCode, code);
  });
});
