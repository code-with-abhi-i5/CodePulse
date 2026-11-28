import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class PiiMaskingSanitizerService {
  constructor() {
    this.patterns = [
      { type: 'CREDIT_CARD', regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/g, mask: '[REDACTED_CC]' },
      { type: 'PASSWORD_FIELD', regex: /"password"\s*:\s*"[^"]+"/gi, mask: '"password": "[REDACTED_PASSWORD]"' },
      { type: 'AUTH_TOKEN', regex: /Bearer\s+[a-zA-Z0-9_.-]{16,}/gi, mask: 'Bearer [REDACTED_TOKEN]' },
      { type: 'EMAIL', regex: /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/gi, mask: '[REDACTED_EMAIL]' }
    ];
  }

  sanitize(text) {
    let sanitized = text;
    let redactedCount = 0;
    const typesRedacted = [];

    for (const p of this.patterns) {
      const matches = sanitized.match(p.regex);
      if (matches) {
        redactedCount += matches.length;
        typesRedacted.push(p.type);
        sanitized = sanitized.replace(p.regex, p.mask);
      }
    }

    return {
      sanitized,
      redactedCount,
      typesRedacted
    };
  }
}

describe('PiiMaskingSanitizerService', () => {
  const sanitizer = new PiiMaskingSanitizerService();

  it('masks emails, passwords, and bearer tokens in log output', () => {
    const raw = 'Login failed for user alice@example.com with "password": "superSecretPassword!" using Bearer eyJhbGciOiJIUzI1NiJ9.test';
    const result = sanitizer.sanitize(raw);

    assert.ok(!result.sanitized.includes('alice@example.com'));
    assert.ok(result.sanitized.includes('[REDACTED_EMAIL]'));
    assert.ok(result.sanitized.includes('[REDACTED_PASSWORD]'));
    assert.ok(result.sanitized.includes('[REDACTED_TOKEN]'));
    assert.equal(result.redactedCount, 3);
  });
});
