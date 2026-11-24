import { Injectable, Logger } from '@nestjs/common';
import {
  BountyCalculatorService,
  DynamicBountyCalculation,
} from './bounty-calculator.service';

export interface ChallengeTrackingRecord {
  challengeId: string;
  title: string;
  baseXp: number;
  totalAttempts: number;
  failedAttempts: number;
  successfulAttempts: number;
  createdAt: Date;
  solvedAt?: Date;
}

@Injectable()
export class RewardMultiplierService {
  private readonly logger = new Logger(RewardMultiplierService.name);

  // In-memory challenge attempt tracker
  private readonly challengeRegistry = new Map<string, ChallengeTrackingRecord>();

  constructor(private readonly bountyCalc: BountyCalculatorService) {}

  public registerChallenge(challengeId: string, title: string, baseXp = 100, createdAt = new Date()): void {
    this.challengeRegistry.set(challengeId, {
      challengeId,
      title,
      baseXp,
      totalAttempts: 0,
      failedAttempts: 0,
      successfulAttempts: 0,
      createdAt,
    });
  }

  /**
   * Records a user submission attempt and dynamically updates the bounty curve in real time.
   */
  public recordAttempt(challengeId: string, isSuccess: boolean): DynamicBountyCalculation {
    let record = this.challengeRegistry.get(challengeId);
    if (!record) {
      this.registerChallenge(challengeId, `Challenge ${challengeId}`, 100);
      record = this.challengeRegistry.get(challengeId)!;
    }

    record.totalAttempts++;
    if (isSuccess) {
      record.successfulAttempts++;
      if (!record.solvedAt) {
        record.solvedAt = new Date();
        this.logger.log(`Challenge ${challengeId} officially SOLVED for the first time!`);
      }
    } else {
      record.failedAttempts++;
    }

    return this.getChallengeBounty(challengeId);
  }

  /**
   * Returns current real-time bounty multipliers and rewards for a challenge.
   */
  public getChallengeBounty(challengeId: string, now = Date.now()): DynamicBountyCalculation {
    const record = this.challengeRegistry.get(challengeId);
    if (!record) {
      throw new Error(`Challenge ${challengeId} not found`);
    }

    const unsolvedDays = record.solvedAt
      ? 0
      : Math.floor((now - record.createdAt.getTime()) / (24 * 60 * 60 * 1000));

    return this.bountyCalc.calculateBounty({
      challengeId: record.challengeId,
      baseXp: record.baseXp,
      totalAttempts: record.totalAttempts,
      failedAttempts: record.failedAttempts,
      unsolvedDays,
      isSolved: !!record.solvedAt,
    });
  }

  /**
   * Retrieves high-bounty / unsolved challenges to incentivize elite developers.
   */
  public getHotBounties(limit = 10): Array<DynamicBountyCalculation & { title: string }> {
    const results: Array<DynamicBountyCalculation & { title: string }> = [];

    for (const [id, record] of this.challengeRegistry.entries()) {
      if (!record.solvedAt) {
        const bounty = this.getChallengeBounty(id);
        results.push({ ...bounty, title: record.title });
      }
    }

    return results.sort((a, b) => b.multiplier - a.multiplier).slice(0, limit);
  }

  public clear(): void {
    this.challengeRegistry.clear();
  }
}
