import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class TournamentBracketGeneratorService {
  generateDoubleEliminationBracket(participants) {
    const count = participants.length;
    if (count < 2) return [];

    let powerOfTwo = 2;
    while (powerOfTwo < count) powerOfTwo *= 2;

    const matches = [];
    const padded = [...participants];
    while (padded.length < powerOfTwo) {
      padded.push('BYE');
    }

    const numMatchesR1 = powerOfTwo / 2;
    for (let i = 0; i < numMatchesR1; i++) {
      const p1 = padded[i];
      const p2 = padded[powerOfTwo - 1 - i];
      matches.push({
        matchId: `WB-R1-M${i + 1}`,
        round: 1,
        player1: p1,
        player2: p2,
        bracket: 'winners',
        isBye: p1 === 'BYE' || p2 === 'BYE'
      });
    }

    matches.push({
      matchId: 'GF-M1',
      round: 99,
      player1: 'TBD',
      player2: 'TBD',
      bracket: 'finals',
      isBye: false
    });

    return matches;
  }
}

describe('TournamentBracketGeneratorService', () => {
  it('generates seeded double elimination bracket with automated bye assignments', () => {
    const generator = new TournamentBracketGeneratorService();
    const bracket = generator.generateDoubleEliminationBracket(['Seed1', 'Seed2', 'Seed3']);

    assert.strictEqual(bracket.length, 3); // 2 in R1 (padded to 4) + 1 Grand Finals
    assert.strictEqual(bracket[0].player1, 'Seed1');
    assert.strictEqual(bracket[0].player2, 'BYE');
    assert.strictEqual(bracket[0].isBye, true);
    assert.strictEqual(bracket[1].player1, 'Seed2');
    assert.strictEqual(bracket[1].player2, 'Seed3');
    assert.strictEqual(bracket[1].isBye, false);
  });
});
