import { describe, it, expect, beforeEach } from 'vitest';
import {
  DifferentialPrivacyClient,
  GLOBAL_SENSITIVITIES,
  PrivacyMetricType,
} from './differential-privacy';

describe('DifferentialPrivacyClient', () => {
  let client: DifferentialPrivacyClient;

  beforeEach(() => {
    DifferentialPrivacyClient.resetInstance();
    client = DifferentialPrivacyClient.getInstance();
  });

  describe('Global Sensitivity Parameters', () => {
    it('provides sensitivity bounds for all 5 core productivity metrics', () => {
      const metrics: PrivacyMetricType[] = [
        'DEVELOPER_SPEED',
        'COMMIT_VOLUME',
        'CODE_CHURN',
        'TEST_SCORE',
        'REVIEW_LATENCY',
      ];

      metrics.forEach((metric) => {
        const config = GLOBAL_SENSITIVITIES[metric];
        expect(config).toBeDefined();
        expect(config.l1Sensitivity).toBeGreaterThan(0);
        expect(config.l2Sensitivity).toBeGreaterThan(0);
        expect(config.unit).toBeTruthy();
      });

      expect(GLOBAL_SENSITIVITIES.DEVELOPER_SPEED.l1Sensitivity).toBe(150);
      expect(GLOBAL_SENSITIVITIES.COMMIT_VOLUME.l1Sensitivity).toBe(50);
      expect(GLOBAL_SENSITIVITIES.CODE_CHURN.l1Sensitivity).toBe(1000);
      expect(GLOBAL_SENSITIVITIES.TEST_SCORE.l1Sensitivity).toBe(100);
      expect(GLOBAL_SENSITIVITIES.REVIEW_LATENCY.l1Sensitivity).toBe(24);
    });
  });

  describe('k-Anonymity Guard (k >= 5)', () => {
    it('suppresses cohort sizes strictly under 5', () => {
      expect(client.isKAnonymous(1)).toBe(false);
      expect(client.isKAnonymous(3)).toBe(false);
      expect(client.isKAnonymous(4)).toBe(false);
    });

    it('approves cohorts with 5 or more members', () => {
      expect(client.isKAnonymous(5)).toBe(true);
      expect(client.isKAnonymous(20)).toBe(true);
      expect(client.isKAnonymous(100)).toBe(true);
    });
  });

  describe('Laplace Noise Injection', () => {
    it('calibrates noise based on sensitivity and epsilon', () => {
      const baseValue = 500;
      const sensitivity = 50;
      const epsilon = 1.0;

      const samples: number[] = [];
      for (let i = 0; i < 100; i++) {
        samples.push(client.addLaplaceNoise(baseValue, sensitivity, epsilon));
      }

      // Mean should be centered close to baseValue
      const mean = samples.reduce((acc, v) => acc + v, 0) / samples.length;
      expect(Math.abs(mean - baseValue)).toBeLessThan(30);

      // Samples should not all be identical
      const unique = new Set(samples);
      expect(unique.size).toBeGreaterThan(50);
    });

    it('rejects invalid epsilon values', () => {
      expect(() => client.addLaplaceNoise(100, 10, 0)).toThrow('Epsilon must be greater than zero');
      expect(() => client.addLaplaceNoise(100, 10, -1)).toThrow('Epsilon must be greater than zero');
    });
  });

  describe('Gaussian Noise Injection', () => {
    it('generates perturbed values using Box-Muller transform', () => {
      const baseValue = 1000;
      const sensitivity = 100;
      const epsilon = 1.0;
      const delta = 1e-5;

      const samples: number[] = [];
      for (let i = 0; i < 100; i++) {
        samples.push(client.addGaussianNoise(baseValue, sensitivity, epsilon, delta));
      }

      const mean = samples.reduce((acc, v) => acc + v, 0) / samples.length;
      expect(Math.abs(mean - baseValue)).toBeLessThan(100);
      expect(new Set(samples).size).toBeGreaterThan(50);
    });

    it('validates delta boundary conditions', () => {
      expect(() => client.addGaussianNoise(100, 10, 1.0, 0)).toThrow('Delta must be in (0, 1)');
      expect(() => client.addGaussianNoise(100, 10, 1.0, 1.5)).toThrow('Delta must be in (0, 1)');
    });
  });

  describe('95% Confidence Interval Computation', () => {
    it('computes symmetric bounds for Laplace mechanism', () => {
      const value = 250;
      const sensitivity = 50;
      const epsilon = 1.0;

      const ci = client.calculateConfidenceInterval(value, sensitivity, epsilon, 1e-5, 'LAPLACE', 0.95);

      expect(ci.confidenceLevel).toBe(0.95);
      expect(ci.marginOfError).toBeGreaterThan(0);
      expect(ci.lowerBound).toBeCloseTo(value - ci.marginOfError, 1);
      expect(ci.upperBound).toBeCloseTo(value + ci.marginOfError, 1);
    });

    it('computes Gaussian bounds using normal distribution quantiles', () => {
      const value = 80;
      const sensitivity = 24;
      const epsilon = 1.0;
      const delta = 1e-5;

      const ci = client.calculateConfidenceInterval(value, sensitivity, epsilon, delta, 'GAUSSIAN', 0.95);

      expect(ci.confidenceLevel).toBe(0.95);
      expect(ci.marginOfError).toBeGreaterThan(0);
      expect(ci.lowerBound).toBeLessThan(value);
      expect(ci.upperBound).toBeGreaterThan(value);
    });
  });

  describe('Metric Formatting', () => {
    it('formats metrics with units and handles suppression gracefully', () => {
      expect(client.formatMetric(142.5, 'DEVELOPER_SPEED')).toBe('142.5 CPM');
      expect(client.formatMetric(35, 'COMMIT_VOLUME')).toBe('35 commits');
      expect(client.formatMetric(null, 'CODE_CHURN')).toBe('Suppressed (k < 5)');
    });
  });
});
