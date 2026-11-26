import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class SeasonalRatingResetService {
  applySeasonalSoftReset(players, baselineRating = 1200, compression = 0.6) {
    return players.map(p => {
      const delta = p.rating - baselineRating;
      const compressedRating = Math.round(baselineRating + delta * compression);
      return {
        rating: Math.max(800, Math.min(3000, compressedRating)),
        rd: Math.min(350, p.rd + 50),
        vol: p.vol
      };
    });
  }
}

describe('SeasonalRatingResetService', () => {
  it('compresses ratings toward baseline and resets deviation for new season split', () => {
    const resetEngine = new SeasonalRatingResetService();
    const [p1, p2] = resetEngine.applySeasonalSoftReset([
      { rating: 2000, rd: 100, vol: 0.06 },
      { rating: 1000, rd: 80, vol: 0.06 }
    ], 1200, 0.5);

    // 2000: 1200 + (800 * 0.5) = 1600
    assert.strictEqual(p1.rating, 1600);
    assert.strictEqual(p1.rd, 150);

    // 1000: 1200 + (-200 * 0.5) = 1100
    assert.strictEqual(p2.rating, 1100);
    assert.strictEqual(p2.rd, 130);
  });
});
