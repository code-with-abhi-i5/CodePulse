import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class Glicko2RatingEngineService {
  updateRating(player, opponent, outcome) {
    const q = Math.log(10) / 400;
    const g = 1 / Math.sqrt(1 + (3 * Math.pow(q, 2) * Math.pow(opponent.rd, 2)) / Math.pow(Math.PI, 2));
    const expected = 1 / (1 + Math.pow(10, (-g * (player.rating - opponent.rating)) / 400));

    const d2 = 1 / (Math.pow(q, 2) * Math.pow(g, 2) * expected * (1 - expected));
    const newRd = Math.round(Math.sqrt(1 / (1 / Math.pow(player.rd, 2) + 1 / d2)));
    const newRating = Math.round(player.rating + (q / (1 / Math.pow(player.rd, 2) + 1 / d2)) * g * (outcome - expected));

    return {
      rating: newRating,
      rd: Math.max(30, Math.min(350, newRd)),
      vol: player.vol
    };
  }
}

describe('Glicko2RatingEngineService', () => {
  it('calculates rating update and decreases deviation on match resolution', () => {
    const engine = new Glicko2RatingEngineService();
    const p1 = { rating: 1500, rd: 200, vol: 0.06 };
    const p2 = { rating: 1400, rd: 150, vol: 0.06 };

    const winResult = engine.updateRating(p1, p2, 1);
    assert.ok(winResult.rating > 1500);
    assert.ok(winResult.rd < p1.rd);

    const lossResult = engine.updateRating(p1, p2, 0);
    assert.ok(lossResult.rating < 1500);
  });
});
