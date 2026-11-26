import { Injectable } from '@nestjs/common';
import { BattlePassStatus } from '../../types/esports';

@Injectable()
export class BattlePassProgressionService {
  calculateTierProgress(totalXp: number, xpPerTier = 1000, maxTier = 50): BattlePassStatus {
    const safeXp = Math.max(0, totalXp);
    const calculatedTier = Math.floor(safeXp / xpPerTier) + 1;
    const tier = Math.min(calculatedTier, maxTier);

    const currentTierXp = tier === maxTier ? xpPerTier : safeXp % xpPerTier;
    const xpToNextTier = tier === maxTier ? 0 : xpPerTier - currentTierXp;
    const overflowBonusXp = tier === maxTier ? Math.max(0, safeXp - (maxTier - 1) * xpPerTier) : 0;

    const unlockedRewards: string[] = [];
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
