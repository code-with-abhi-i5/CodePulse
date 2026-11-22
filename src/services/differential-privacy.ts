/**
 * Differential Privacy Client Engine
 * Provides client-side utilities, sensitivity definitions, noise calibration,
 * k-anonymity validation, and API bindings for Organization Productivity & Benchmark Analytics (#542).
 */

export type PrivacyMetricType =
  | 'DEVELOPER_SPEED'
  | 'COMMIT_VOLUME'
  | 'CODE_CHURN'
  | 'TEST_SCORE'
  | 'REVIEW_LATENCY';

export type DifferentialPrivacyMechanism = 'LAPLACE' | 'GAUSSIAN';

export interface MetricSensitivity {
  l1Sensitivity: number;
  l2Sensitivity: number;
  unit: string;
}

export const GLOBAL_SENSITIVITIES: Record<PrivacyMetricType, MetricSensitivity> = {
  DEVELOPER_SPEED: {
    l1Sensitivity: 150.0,
    l2Sensitivity: 150.0,
    unit: 'CPM',
  },
  COMMIT_VOLUME: {
    l1Sensitivity: 50.0,
    l2Sensitivity: 50.0,
    unit: 'commits',
  },
  CODE_CHURN: {
    l1Sensitivity: 1000.0,
    l2Sensitivity: 1000.0,
    unit: 'LOC',
  },
  TEST_SCORE: {
    l1Sensitivity: 100.0,
    l2Sensitivity: 100.0,
    unit: 'points',
  },
  REVIEW_LATENCY: {
    l1Sensitivity: 24.0,
    l2Sensitivity: 24.0,
    unit: 'hours',
  },
};

export interface OrgProductivityQuery {
  organizationId: string;
  metricType: PrivacyMetricType;
  teamCohort?: string;
  cohortSize: number;
  mechanism?: DifferentialPrivacyMechanism;
  epsilon?: number;
  delta?: number;
}

export interface ConfidenceInterval {
  confidenceLevel: number;
  lowerBound: number;
  upperBound: number;
  marginOfError: number;
}

export interface PrivacyGuarantee {
  mechanism: DifferentialPrivacyMechanism;
  epsilon: number;
  delta: number;
  globalSensitivity: number;
  noiseScale: number;
  consumedBudget: number;
  remainingBudget: number;
  membershipInferenceRisk: 'NEGLIGIBLE' | 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface OrgBenchmarkReport {
  organizationId: string;
  metricType: PrivacyMetricType;
  teamCohort: string;
  isSuppressed: boolean;
  suppressionReason?: string;
  cohortSize: number;
  privatizedValue: number | null;
  unit: string;
  confidenceInterval: ConfidenceInterval | null;
  privacyGuarantee: PrivacyGuarantee;
  timestamp: string;
}

export interface PrivacyBudgetStatus {
  consumerKey: string;
  maxEpsilon: number;
  consumedEpsilon: number;
  remainingEpsilon: number;
  resetAt: string;
  isExhausted: boolean;
}

export class DifferentialPrivacyClient {
  private static instance: DifferentialPrivacyClient | null = null;
  private readonly K_ANONYMITY_THRESHOLD = 5;
  private readonly DEFAULT_EPSILON = 1.0;
  private readonly DEFAULT_DELTA = 1e-5;

  public static getInstance(): DifferentialPrivacyClient {
    if (!DifferentialPrivacyClient.instance) {
      DifferentialPrivacyClient.instance = new DifferentialPrivacyClient();
    }
    return DifferentialPrivacyClient.instance;
  }

  public static resetInstance(): void {
    DifferentialPrivacyClient.instance = null;
  }

  /**
   * Evaluates if cohort satisfies k-anonymity (k >= 5)
   */
  public isKAnonymous(cohortSize: number, kThreshold: number = this.K_ANONYMITY_THRESHOLD): boolean {
    return cohortSize >= kThreshold;
  }

  /**
   * Samples random value from Laplace distribution Lap(0, scale)
   * where scale = L1_sensitivity / epsilon
   */
  public sampleLaplaceNoise(scale: number): number {
    if (scale <= 0) return 0;
    // Uniform random in (-0.5, 0.5)
    let u = Math.random() - 0.5;
    while (u === 0) {
      u = Math.random() - 0.5;
    }
    return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }

  /**
   * Samples standard Gaussian random variable via Box-Muller transform
   */
  public sampleStandardGaussian(): number {
    let u1 = 0;
    let u2 = 0;
    while (u1 === 0) u1 = Math.random();
    while (u2 === 0) u2 = Math.random();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  }

  /**
   * Injects calibrated Laplace noise satisfying epsilon-differential privacy
   */
  public addLaplaceNoise(value: number, sensitivity: number, epsilon: number = this.DEFAULT_EPSILON): number {
    if (epsilon <= 0) {
      throw new Error('Epsilon must be greater than zero');
    }
    const scale = sensitivity / epsilon;
    const noise = this.sampleLaplaceNoise(scale);
    return Math.round((value + noise) * 100) / 100;
  }

  /**
   * Injects calibrated Gaussian noise satisfying (epsilon, delta)-differential privacy
   */
  public addGaussianNoise(
    value: number,
    sensitivity: number,
    epsilon: number = this.DEFAULT_EPSILON,
    delta: number = this.DEFAULT_DELTA,
  ): number {
    if (epsilon <= 0) {
      throw new Error('Epsilon must be greater than zero');
    }
    if (delta <= 0 || delta >= 1) {
      throw new Error('Delta must be in (0, 1)');
    }
    const sigma = (sensitivity * Math.sqrt(2 * Math.log(1.25 / delta))) / epsilon;
    const noise = sigma * this.sampleStandardGaussian();
    return Math.round((value + noise) * 100) / 100;
  }

  /**
   * Calculates confidence intervals for privatized outputs (default: 95% CI)
   */
  public calculateConfidenceInterval(
    value: number,
    sensitivity: number,
    epsilon: number = this.DEFAULT_EPSILON,
    delta: number = this.DEFAULT_DELTA,
    mechanism: DifferentialPrivacyMechanism = 'LAPLACE',
    confidenceLevel = 0.95,
  ): ConfidenceInterval {
    let marginOfError = 0;
    if (mechanism === 'LAPLACE') {
      const b = sensitivity / epsilon;
      // Laplace quantile: P(|X| <= W) = 1 - exp(-W/b) = confidenceLevel => W = -b * ln(1 - confidenceLevel)
      marginOfError = -b * Math.log(1 - confidenceLevel);
    } else {
      const sigma = (sensitivity * Math.sqrt(2 * Math.log(1.25 / delta))) / epsilon;
      // Z-score for 95% = ~1.95996
      const zScore = 1.95996;
      marginOfError = zScore * sigma;
    }

    const roundedMargin = Math.round(marginOfError * 100) / 100;
    return {
      confidenceLevel,
      lowerBound: Math.round((value - marginOfError) * 100) / 100,
      upperBound: Math.round((value + marginOfError) * 100) / 100,
      marginOfError: roundedMargin,
    };
  }

  /**
   * Formats privatized metric for executive presentations
   */
  public formatMetric(value: number | null, metricType: PrivacyMetricType): string {
    if (value === null) return 'Suppressed (k < 5)';
    const config = GLOBAL_SENSITIVITIES[metricType];
    return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${config.unit}`;
  }
}
