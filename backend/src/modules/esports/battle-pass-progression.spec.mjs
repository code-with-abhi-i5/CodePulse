import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class BattlePassProgressionService {
  calculateTierProgress(totalXp, xpPerTier = 1000, maxTier = 50) {
    const safeXp = Math.max(0, totalXp);
    const calculatedTier = Math.floor(safeXp / xpPerTier) + 1;
    const tier = Math.min(calculatedTier, maxTier);
    const currentTierXp = tier === maxTier ? xpPerTier : safeXp % xpPerTier;
    const xpToNextTier = tier === maxTier ? 0 : xpPerTier - currentTierXp;
    const overflowBonusXp = tier === maxTier ? Math.max(0, safeXp - (maxTier - 1) * xpPerTier) : 0;

    const unlockedRewards = [];
    for (let t = 1; t <= tier; t++) {
      if (t === 1) unlockedRewards.push('Novice Badge');
      else if (t === 10) unlockedRewards.push('Silver Code Skin');
      else if (t === 25) unlockedRewards.push('Golden Terminal Theme');
      else if (t === 50) unlockedRewards.push('Legendary Grandmaster Avatar');
    }

    return {
      tier,
      currentTierXp,
      xpToNextTier,
      unlockedRewards,
      overflowBonusXp
    };
  }
}

describe('BattlePassProgressionService', () => {
  it('accurately calculates battle pass tier unlocks and badges', () => {
    const bp = new BattlePassProgressionService();
    const status = bp.calculateTierProgress(25500, 1000, 50);

    assert.strictEqual(status.tier, 26);
    assert.strictEqual(status.currentTierXp, 500);
    assert.strictEqual(status.xpToNextTier, 500);
    assert.ok(status.unlockedRewards.includes('Golden Terminal Theme'));
    assert.ok(status.unlockedRewards.includes('Silver Code Skin'));
  });
});
