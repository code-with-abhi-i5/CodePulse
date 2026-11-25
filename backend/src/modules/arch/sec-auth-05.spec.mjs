import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TimingAttackResistantComparatorService } from './sec-auth-05.service.ts';

describe('TimingAttackResistantComparatorService (SEC-AUTH-05)', () => {
  it('performs constant-time string and hex signature comparisons safely', () => {
    const comparator = new TimingAttackResistantComparatorService();

    assert.strictEqual(comparator.compareStringsConstantTime('token-secret-123', 'token-secret-123'), true);
    assert.strictEqual(comparator.compareStringsConstantTime('token-secret-123', 'token-secret-456'), false);
    assert.strictEqual(comparator.compareStringsConstantTime('short', 'much-longer-string'), false);

    const hex1 = 'abcdef0123456789';
    const hex2 = 'abcdef0123456789';
    const hex3 = 'abcdef0123456780';
    assert.strictEqual(comparator.compareHexSignatures(hex1, hex2), true);
    assert.strictEqual(comparator.compareHexSignatures(hex1, hex3), false);
  });
});
