import { Injectable, Logger } from '@nestjs/common';

export type BadgeRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';

export interface ChallengeBountyInput {
  challengeId: string;
  baseXp: number;
  totalAttempts: number;
  failedAttempts: number;
  unsolvedDays: number;
  isSolved: boolean;
}

export interface DynamicBountyCalculation {
  challengeId: string;
  baseXp: number;
  dynamicXp: number;
  multiplier: number; // 1.0x to 5.0x
  communityFailureRatePct: number;
  badgeRarity: BadgeRarity;
  bountyTier: 'STANDARD' | 'ELEVATED' | 'HIGH_BOUNTY' | 'MYTHIC_BOUNTY';
  incentiveMessage?: string;
}

@Injectable()
export class BountyCalculatorService {
  private readonly logger = new Logger(BountyCalculatorService.name);

  // Maximum reward scaling ceiling: 5.0x
  public static readonly MAX_REWARD_MULTIPLIER = 5.0;

  /**
   * Calculates the algorithmic bounty curve scaling with community failure rate and age.
   */
  public calculateBounty(input: ChallengeBountyInput): DynamicBountyCalculation {
    const total = Math.max(0, input.totalAttempts);
    const failed = Math.min(total, Math.max(0, input.failedAttempts));

    const failureRate = total >= 5 ? failed / total : 0;
    const failureRatePct = Number((failureRate * 100).toFixed(1));

    // 1. Exponential failure rate multiplier: 1.0 + 2.5 * (F^3)
    const failureMultiplier = 1.0 + 2.5 * Math.pow(failureRate, 3);

    // 2. Unsolved time decay bonus: +5% every 3 days unsolved, up to +50%
    const timeMultiplier = input.isSolved
      ? 1.0
      : 1.0 + Math.min(0.5, (input.unsolvedDays / 3) * 0.05);

    // Combined multiplier clamped between 1.0x and 5.0x
    const rawMultiplier = failureMultiplier * timeMultiplier;
    const multiplier = Number(
      Math.min(BountyCalculatorService.MAX_REWARD_MULTIPLIER, Math.max(1.0, rawMultiplier)).toFixed(2),
    );

    const dynamicXp = Math.round(input.baseXp * multiplier);

    // Escalate Badge Rarity based on difficulty and community failure
    let badgeRarity: BadgeRarity = 'COMMON';
    let bountyTier: DynamicBountyCalculation['bountyTier'] = 'STANDARD';
    let incentiveMessage: string | undefined;

    if (failureRatePct >= 95 && input.unsolvedDays >= 14 && !input.isSolved) {
      badgeRarity = 'MYTHIC';
      bountyTier = 'MYTHIC_BOUNTY';
      incentiveMessage = `🔥 MYTHIC BOUNTY (${multiplier}x XP): 95%+ of participants have failed this challenge. Top-tier algorithm specialists requested!`;
    } else if (failureRatePct >= 85 || multiplier >= 3.0) {
      badgeRarity = 'LEGENDARY';
      bountyTier = 'HIGH_BOUNTY';
      incentiveMessage = `⭐ HIGH BOUNTY (${multiplier}x XP): Unsolved community hurdle. High XP bounty active.`;
    } else if (failureRatePct >= 65 || multiplier >= 2.0) {
      badgeRarity = 'EPIC';
      bountyTier = 'ELEVATED';
    } else if (failureRatePct >= 40) {
      badgeRarity = 'RARE';
    } else {
      badgeRarity = 'COMMON';
    }

    return {
      challengeId: input.challengeId,
      baseXp: input.baseXp,
      dynamicXp,
      multiplier,
      communityFailureRatePct: failureRatePct,
      badgeRarity,
      bountyTier,
      incentiveMessage,
    };
  }
}
