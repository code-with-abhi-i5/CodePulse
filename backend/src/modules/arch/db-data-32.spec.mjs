import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PrismaQuerySanitizerMiddlewareService } from './db-data-32.service.ts';

describe('PrismaQuerySanitizerMiddlewareService (DB-DATA-32)', () => {
  it('detects and strips dangerous SQL comments and payload bombs', () => {
    const sanitizer = new PrismaQuerySanitizerMiddlewareService();

    const malicious = "admin' OR 1=1; -- payload";
    const res = sanitizer.sanitizeInput(malicious);
    assert.strictEqual(res.isSafe, false);
    assert.strictEqual(res.sanitized, "admin' OR 1=1;  payload");

    const safe = "normal search text";
    const safeRes = sanitizer.sanitizeInput(safe);
    assert.strictEqual(safeRes.isSafe, true);
    assert.strictEqual(safeRes.sanitized, safe);
  });
});
