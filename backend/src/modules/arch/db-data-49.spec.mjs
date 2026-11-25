import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ParameterBindingFuzzingHarnessService } from './db-data-49.service.ts';

describe('ParameterBindingFuzzingHarnessService (DB-DATA-49)', () => {
  it('passes parameterized queries and catches raw string concatenation', () => {
    const harness = new ParameterBindingFuzzingHarnessService();

    // Good builder (parameterized)
    const goodBuilder = (input) => ({
      sql: 'SELECT * FROM users WHERE email = $1',
      params: [input]
    });
    const goodRes = harness.testQueryBuilder(goodBuilder);
    assert.strictEqual(goodRes.isResilient, true);

    // Vulnerable builder (concatenation)
    const badBuilder = (input) => ({
      sql: "SELECT * FROM users WHERE email = '" + input + "'",
      params: []
    });
    const badRes = harness.testQueryBuilder(badBuilder);
    assert.strictEqual(badRes.isResilient, false);
    assert.ok(badRes.failedVectors.length > 0);
  });
});
