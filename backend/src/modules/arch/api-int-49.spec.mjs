import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GraphqlBigDecimalScalarService } from './api-int-49.service.ts';

describe('GraphqlBigDecimalScalarService (API-INT-49)', () => {
  it('serializes and adds high-precision decimal numbers without IEEE-754 drift', () => {
    const scalar = new GraphqlBigDecimalScalarService();

    assert.strictEqual(scalar.serialize('100.00000001'), '100.00000001');
    assert.strictEqual(scalar.add('0.1', '0.2'), '0.3');
  });
});
