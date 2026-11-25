import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SqlAstInjectionValidatorService } from './sec-auth-18.service.ts';

describe('SqlAstInjectionValidatorService (SEC-AUTH-18)', () => {
  it('validates parameterized query trees and flags raw literals and comment injections', () => {
    const validator = new SqlAstInjectionValidatorService();

    // Valid parameterized query
    const valid = validator.validateQueryStructure('SELECT * FROM users WHERE email = $1 AND tenant_id = $2', 2);
    assert.strictEqual(valid.isSafe, true);

    // Unparameterized raw literal
    const unparam = validator.validateQueryStructure("SELECT * FROM users WHERE email = 'admin@example.com'", 0);
    assert.strictEqual(unparam.isSafe, false);
    assert.ok(unparam.violations[0].includes('Raw unparameterized literal'));

    // Comment injection
    const comment = validator.validateQueryStructure("SELECT * FROM users WHERE status = $1 -- injected comment", 1);
    assert.strictEqual(comment.isSafe, false);
    assert.ok(comment.violations.some((v) => v.includes('comment characters detected')));
  });
});
