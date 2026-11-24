import { Test, TestingModule } from '@nestjs/testing';
import { DoraCalculatorService, DoraRawDataInput } from './dora-calculator.service';

describe('DoraCalculatorService', () => {
  let calculator: DoraCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DoraCalculatorService],
    }).compile();

    calculator = module.get<DoraCalculatorService>(DoraCalculatorService);
  });

  describe('DORA Tier Benchmark Categorization', () => {
    it('classifies Elite team with frequent deploys, short lead times, rapid recovery, and low CFR', () => {
      const eliteInput: DoraRawDataInput = {
        windowDays: 30,
        deployments: [
          // 40 deployments in 30 days (>1/day => Elite)
          ...Array.from({ length: 40 }).map((_, i) => ({
            deployedAt: new Date(Date.now() - i * 12 * 3600000),
            commitCreatedAt: new Date(Date.now() - (i * 12 + 4) * 3600000), // 4 hours lead time (<24h => Elite)
            isFailedOrRollback: i === 0, // 1 failure out of 40 = 2.5% (<5% => Elite)
          })),
        ],
        incidents: [
          {
            startedAt: new Date(Date.now() - 3600000),
            recoveredAt: new Date(Date.now() - 3600000 + 1800000), // 30 mins recovery (<1h => Elite)
          },
        ],
      };

      const result = calculator.computeDoraMetrics(eliteInput);
      expect(result.tiers.overallCompositeTier).toBe('Elite');
      expect(result.tiers.deploymentFrequencyTier).toBe('Elite');
      expect(result.tiers.leadTimeTier).toBe('Elite');
      expect(result.tiers.mttrTier).toBe('Elite');
      expect(result.tiers.changeFailureRateTier).toBe('Elite');
      expect(result.tiers.percentileRanking).toBe(95);
      expect(result.changeFailureRatePct).toBe(2.5);
    });

    it('classifies Low performance tier when metrics lag behind industry benchmarks', () => {
      const lowInput: DoraRawDataInput = {
        windowDays: 90,
        deployments: [
          // 1 deployment in 90 days (<0.03/day => Low)
          {
            deployedAt: new Date(Date.now()),
            commitCreatedAt: new Date(Date.now() - 800 * 3600000), // ~33 days lead time (>1 month => Low)
            isFailedOrRollback: true, // 100% failure rate (>30% => Low)
          },
        ],
        incidents: [
          {
            startedAt: new Date(Date.now() - 300 * 3600000),
            recoveredAt: new Date(Date.now()), // ~12 days recovery (>1 week => Low)
          },
        ],
      };

      const result = calculator.computeDoraMetrics(lowInput);
      expect(result.tiers.overallCompositeTier).toBe('Low');
      expect(result.tiers.deploymentFrequencyTier).toBe('Low');
      expect(result.tiers.leadTimeTier).toBe('Low');
      expect(result.tiers.mttrTier).toBe('Low');
      expect(result.tiers.changeFailureRateTier).toBe('Low');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Empty Data Fallback', () => {
    it('handles zero deployments gracefully', () => {
      const emptyInput: DoraRawDataInput = {
        windowDays: 30,
        deployments: [],
        incidents: [],
      };

      const result = calculator.computeDoraMetrics(emptyInput);
      expect(result.totalDeployments).toBe(0);
      expect(result.deploymentsPerDay).toBe(0);
      expect(result.leadTimeHours).toBe(0);
      expect(result.changeFailureRatePct).toBe(0);
    });
  });
});
