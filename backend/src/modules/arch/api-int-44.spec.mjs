import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ApiPathSanitizerService } from './api-int-44.service.ts';

describe('ApiPathSanitizerService (API-INT-44)', () => {
  it('detects and sanitizes path traversal tokens in path parameters', () => {
    const sanitizer = new ApiPathSanitizerService();

    assert.strictEqual(sanitizer.isSafe('valid-file.ts'), true);
    assert.strictEqual(sanitizer.isSafe('../etc/passwd'), false);
    assert.strictEqual(sanitizer.isSafe('challenge%00.ts'), false);

    const cleaned = sanitizer.sanitizeParam('..%2F..%2Fetc%2Fhosts');
    assert.strictEqual(cleaned.includes('..'), false);
    assert.strictEqual(cleaned, 'etc/hosts');
  });
});
