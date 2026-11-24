import { BountyCalculatorService } from './bounty-calculator.service';
import { RewardMultiplierService } from './reward-multiplier.service';

describe('RewardMultiplierService & BountyCalculatorService', () => {
  let bountyCalculator: BountyCalculatorService;
  let rewardMultiplierService: RewardMultiplierService;

  beforeEach(() => {
    bountyCalculator = new BountyCalculatorService();
    rewardMultiplierService = new RewardMultiplierService(bountyCalculator);
  });

  describe('BountyCalculatorService', () => {
    it('should return baseline 1.0x multiplier when total attempts are below threshold', () => {
      const result = bountyCalculator.calculateBounty({
        challengeId: 'chall-1',
        baseXp: 100,
        totalAttempts: 3,
        failedAttempts: 3,
        unsolvedDays: 0,
        isSolved: false,
      });

      expect(result.multiplier).toBe(1.0);
      expect(result.dynamicXp).toBe(100);
      expect(result.badgeRarity).toBe('COMMON');
      expect(result.bountyTier).toBe('STANDARD');
    });

    it('should scale exponentially when failure rate is high (>85%)', () => {
      const result = bountyCalculator.calculateBounty({
        challengeId: 'chall-2',
        baseXp: 200,
        totalAttempts: 100,
        failedAttempts: 92,
        unsolvedDays: 5,
        isSolved: false,
      });

      expect(result.communityFailureRatePct).toBe(92);
      expect(result.multiplier).toBeGreaterThan(2.5);
      expect(result.dynamicXp).toBeGreaterThan(500);
      expect(result.badgeRarity).toMatch(/LEGENDARY|MYTHIC/);
    });

    it('should escalate to MYTHIC badge and clamp to max 5.0x for extreme failure and age', () => {
      const result = bountyCalculator.calculateBounty({
        challengeId: 'chall-3',
        baseXp: 500,
        totalAttempts: 200,
        failedAttempts: 198, // 99% failure
        unsolvedDays: 30, // > 14 days
        isSolved: false,
      });

      expect(result.communityFailureRatePct).toBe(99);
      expect(result.badgeRarity).toBe('MYTHIC');
      expect(result.bountyTier).toBe('MYTHIC_BOUNTY');
      expect(result.multiplier).toBeLessThanOrEqual(5.0);
      expect(result.multiplier).toBeGreaterThanOrEqual(3.5);
      expect(result.incentiveMessage).toContain('MYTHIC BOUNTY');
    });

    it('should remove time decay bonus once solved', () => {
      const resultSolved = bountyCalculator.calculateBounty({
        challengeId: 'chall-4',
        baseXp: 100,
        totalAttempts: 20,
        failedAttempts: 18,
        unsolvedDays: 20,
        isSolved: true,
      });

      const resultUnsolved = bountyCalculator.calculateBounty({
        challengeId: 'chall-4',
        baseXp: 100,
        totalAttempts: 20,
        failedAttempts: 18,
        unsolvedDays: 20,
        isSolved: false,
      });

      expect(resultUnsolved.multiplier).toBeGreaterThan(resultSolved.multiplier);
    });
  });

  describe('RewardMultiplierService', () => {
    it('should register challenge and track consecutive user attempts in real time', () => {
      rewardMultiplierService.registerChallenge('algo-graph', 'Graph Algorithms', 150);

      // 8 consecutive failures
      for (let i = 0; i < 8; i++) {
        rewardMultiplierService.recordAttempt('algo-graph', false);
      }

      const bountyAfterFails = rewardMultiplierService.getChallengeBounty('algo-graph');
      expect(bountyAfterFails.communityFailureRatePct).toBe(100);
      expect(bountyAfterFails.multiplier).toBeGreaterThan(3.0);

      // Now 1 success
      const bountyAfterSuccess = rewardMultiplierService.recordAttempt('algo-graph', true);
      expect(bountyAfterSuccess.communityFailureRatePct).toBeCloseTo(88.9, 0);
    });

    it('should list hot bounties sorted by descending multiplier', () => {
      rewardMultiplierService.registerChallenge('easy-1', 'Easy 1', 100);
      rewardMultiplierService.registerChallenge('hard-1', 'Hard 1', 200);

      for (let i = 0; i < 10; i++) {
        rewardMultiplierService.recordAttempt('hard-1', false);
      }
      for (let i = 0; i < 10; i++) {
        rewardMultiplierService.recordAttempt('easy-1', true);
      }

      const hot = rewardMultiplierService.getHotBounties();
      expect(hot.length).toBe(2);
      expect(hot[0].challengeId).toBe('hard-1');
      expect(hot[0].multiplier).toBeGreaterThan(hot[1].multiplier);
    });
  });
});
