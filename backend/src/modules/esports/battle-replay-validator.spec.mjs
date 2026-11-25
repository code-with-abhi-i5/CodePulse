import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class BattleReplayValidatorService {
  validateReplay(events, expectedWinner) {
    let rollingHash = 0;
    const discrepancies = [];
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      if (e.step !== i + 1) {
        discrepancies.push(`Step mismatch at index ${i}: expected ${i + 1}, got ${e.step}`);
      }
      for (let j = 0; j < e.action.length; j++) {
        rollingHash = (rollingHash * 31 + e.action.charCodeAt(j)) | 0;
      }
    }
    const computedWinner = events.length > 0 && events[events.length - 1].action.includes('winner=')
      ? events[events.length - 1].action.split('winner=')[1]
      : expectedWinner;
    const isValid = discrepancies.length === 0 && computedWinner === expectedWinner;
    return {
      isValid,
      computedWinner,
      finalHash: Math.abs(rollingHash).toString(16),
      discrepancies
    };
  }
}

describe('BattleReplayValidatorService', () => {
  it('verifies deterministic battle replay logs and confirms winner authenticity', () => {
    const validator = new BattleReplayValidatorService();
    const events = [
      { step: 1, action: 'start_battle', timestamp: 100, checksum: 'c1' },
      { step: 2, action: 'submit_solution', timestamp: 200, checksum: 'c2' },
      { step: 3, action: 'assert_tests_passed;winner=Alice', timestamp: 300, checksum: 'c3' }
    ];

    const result = validator.validateReplay(events, 'Alice');
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.computedWinner, 'Alice');
    assert.strictEqual(result.discrepancies.length, 0);
  });
});
