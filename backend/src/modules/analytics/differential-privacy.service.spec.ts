import {
  DifferentialPrivacyService,
  GLOBAL_SENSITIVITIES,
} from './differential-privacy.service';
import {
  PrivacyMetricType,
  DifferentialPrivacyMechanism,
} from './dto/org-metrics.dto';
import { BadRequestException } from '@nestjs/common';

describe('DifferentialPrivacyService (Laplace/Gaussian Engine & Sensitivity #542)', () => {
  let dp: DifferentialPrivacyService;

  beforeEach(() => {
    dp = new DifferentialPrivacyService({
      defaultEpsilon: 1.0,
      defaultDelta: 1e-5,
      minCohortSize: 5,
    });
  });

  describe('Global Sensitivity Parameters (#542)', () => {
    it('defines calibrated domain-specific global sensitivities', () => {
      expect(GLOBAL_SENSITIVITIES[PrivacyMetricType.DEVELOPER_SPEED].l1).toBe(150.0);
      expect(GLOBAL_SENSITIVITIES[PrivacyMetricType.COMMIT_VOLUME].l1).toBe(50.0);
      expect(GLOBAL_SENSITIVITIES[PrivacyMetricType.CODE_CHURN].l1).toBe(1000.0);
      expect(GLOBAL_SENSITIVITIES[PrivacyMetricType.TEST_SCORE].l1).toBe(100.0);
      expect(GLOBAL_SENSITIVITIES[PrivacyMetricType.REVIEW_LATENCY].l1).toBe(24.0);
    });
  });

  describe('Laplace & Gaussian Noise Injection Mechanisms', () => {
    it('samples Laplace noise and adds calibrated noise preserving statistical accuracy within 3%', () => {
      const trueValue = 1000;
      const samples: number[] = [];
      for (let i = 0; i < 500; i++) {
        samples.push(dp.addLaplaceNoise(trueValue, 1.0, 1.0));
      }

      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      const errorPercent = (Math.abs(mean - trueValue) / trueValue) * 100;

      expect(errorPercent).toBeLessThan(3.0);
      expect(samples.some((s) => s !== trueValue)).toBe(true);
    });

    it('adds Gaussian noise for approximate (epsilon, delta)-differential privacy', () => {
      const trueValue = 500;
      const noisy = dp.addGaussianNoise(trueValue, 1.0, 1.0, 1e-5);
      expect(typeof noisy).toBe('number');
      expect(Math.abs(noisy - trueValue)).toBeLessThan(50);
    });

    it('rejects invalid epsilon or delta parameters with BadRequestException', () => {
      expect(() => dp.addLaplaceNoise(100, 1.0, -0.5)).toThrow(BadRequestException);
      expect(() => dp.addGaussianNoise(100, 1.0, 1.0, -1e-5)).toThrow(BadRequestException);
    });
  });

  describe('K-Anonymity Protection (k < 5 Suppression)', () => {
    it('suppresses cohorts where size N < 5 to prevent individual deanonymization', () => {
      const smallCohort = [
        { commitCount: 12 },
        { commitCount: 8 },
        { commitCount: 3 },
      ];

      const result = dp.privatizeQuery(smallCohort, (item) => item.commitCount, {
        consumerKey: 'user-a',
      });

      expect(result.cohortSize).toBe(3);
      expect(result.suppressed).toBe(true);
      expect(result.noisyValue).toBeNull();
    });

    it('applies Laplace noise and returns privatized aggregate for cohorts with N >= 5', () => {
      const validCohort = [
        { commitCount: 10 },
        { commitCount: 15 },
        { commitCount: 20 },
        { commitCount: 25 },
        { commitCount: 30 },
      ];

      const result = dp.privatizeQuery(validCohort, (item) => item.commitCount, {
        consumerKey: 'user-b',
        epsilon: 1.0,
      });

      expect(result.cohortSize).toBe(5);
      expect(result.suppressed).toBe(false);
      expect(typeof result.noisyValue).toBe('number');
    });
  });

  describe('Privacy Loss Budget Management', () => {
    it('tracks cumulative privacy loss and enforces privacy budget limits (throws when budget exceeded)', () => {
      const key = 'analyst-1';
      dp.consumeBudget(key, 4.0, 1e-5, 10.0);
      const status1 = dp.getBudgetStatus(key, 10.0);
      expect(status1.epsilonConsumed).toBe(4.0);
      expect(status1.queriesExecuted).toBe(1);

      dp.consumeBudget(key, 5.5, 1e-5, 10.0);
      expect(dp.getBudgetStatus(key, 10.0).epsilonConsumed).toBe(9.5);

      expect(() => {
        dp.consumeBudget(key, 1.0, 1e-5, 10.0);
      }).toThrow(BadRequestException);
    });

    it('resets budget when requested', () => {
      dp.consumeBudget('user-reset', 5.0);
      expect(dp.getBudgetStatus('user-reset').epsilonConsumed).toBe(5.0);

      dp.resetBudget('user-reset');
      expect(dp.getBudgetStatus('user-reset').epsilonConsumed).toBe(0);
    });
  });

  describe('Confidence Intervals & Executive Benchmark Reports (#542)', () => {
    it('computes 95% confidence intervals for Laplace and Gaussian mechanisms', () => {
      const laplaceCi = dp.calculateConfidenceInterval(
        1000,
        50.0,
        1.0,
        1e-5,
        DifferentialPrivacyMechanism.LAPLACE,
        0.95,
      );

      expect(laplaceCi.lowerBound).toBeLessThan(1000);
      expect(laplaceCi.upperBound).toBeGreaterThan(1000);
      expect(laplaceCi.confidenceLevel).toBe(0.95);

      const gaussianCi = dp.calculateConfidenceInterval(
        1000,
        50.0,
        1.0,
        1e-5,
        DifferentialPrivacyMechanism.GAUSSIAN,
        0.95,
      );

      expect(gaussianCi.lowerBound).toBeLessThan(1000);
      expect(gaussianCi.upperBound).toBeGreaterThan(1000);
    });

    it('generates full executive benchmark report with k-anonymity and DP guarantees', () => {
      const teamDevelopers = [
        { cpm: 220 },
        { cpm: 250 },
        { cpm: 190 },
        { cpm: 280 },
        { cpm: 210 },
        { cpm: 260 },
      ];

      const report = dp.generateExecutiveBenchmarkReport(
        'org-enterprise',
        PrivacyMetricType.DEVELOPER_SPEED,
        teamDevelopers,
        (d) => d.cpm,
        {
          epsilon: 1.0,
          mechanism: DifferentialPrivacyMechanism.LAPLACE,
          consumerKey: 'exec-1',
        },
      );

      expect(report.organizationId).toBe('org-enterprise');
      expect(report.kAnonymityMet).toBe(true);
      expect(report.suppressed).toBe(false);
      expect(report.cohortSize).toBe(6);
      expect(report.noisyAggregate).toBeDefined();
      expect(report.noisyMean).toBeDefined();
      expect(report.confidenceInterval).toBeDefined();
      expect(report.privacyGuarantee.epsilon).toBe(1.0);
      expect(report.membershipInferenceRisk).toBe('NEGLIGIBLE');
    });

    it('suppresses report when team has fewer than 5 members', () => {
      const tinyTeam = [
        { cpm: 220 },
        { cpm: 250 },
      ];

      const report = dp.generateExecutiveBenchmarkReport(
        'org-startup',
        PrivacyMetricType.DEVELOPER_SPEED,
        tinyTeam,
        (d) => d.cpm,
        { consumerKey: 'exec-2' },
      );

      expect(report.kAnonymityMet).toBe(false);
      expect(report.suppressed).toBe(true);
      expect(report.noisyAggregate).toBeNull();
      expect(report.noisyMean).toBeNull();
      expect(report.confidenceInterval).toBeNull();
      expect(report.membershipInferenceRisk).toBe('SUPPRESSED');
      expect(report.suppressionReason).toContain('K-anonymity protection');
    });
  });
});
