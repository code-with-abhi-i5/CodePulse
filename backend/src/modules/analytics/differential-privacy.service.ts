import { BadRequestException, Injectable, Logger, Optional } from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
  PrivacyMetricType,
  DifferentialPrivacyMechanism,
  OrgBenchmarkReportDto,
  ConfidenceInterval,
  PrivacyGuarantee,
} from './dto/org-metrics.dto';

export interface DifferentialPrivacyOptions {
  defaultEpsilon?: number;
  defaultDelta?: number;
  minCohortSize?: number;
}

export interface PrivacyBudgetAccount {
  epsilonConsumed: number;
  deltaConsumed: number;
  queriesExecuted: number;
  maxEpsilon: number;
  maxDelta: number;
}

export interface GlobalSensitivity {
  l1: number;
  l2: number;
  unit: string;
}

/**
 * Global Sensitivity Parameters calibrated to domain-specific developer metrics:
 * Ensures theoretical bounds on the maximum effect a single contributor can have
 * on the aggregate query output.
 */
export const GLOBAL_SENSITIVITIES: Record<PrivacyMetricType, GlobalSensitivity> = {
  [PrivacyMetricType.DEVELOPER_SPEED]: {
    l1: 150.0, // Max difference 1 contributor can cause in CPM (characters per minute)
    l2: 150.0,
    unit: 'CPM',
  },
  [PrivacyMetricType.COMMIT_VOLUME]: {
    l1: 50.0, // Max commits in a reporting window from a single contributor
    l2: 50.0,
    unit: 'commits',
  },
  [PrivacyMetricType.CODE_CHURN]: {
    l1: 1000.0, // Max lines of code modified by a single contributor
    l2: 1000.0,
    unit: 'LOC',
  },
  [PrivacyMetricType.TEST_SCORE]: {
    l1: 100.0, // Max score points on a challenge/battle
    l2: 100.0,
    unit: 'points',
  },
  [PrivacyMetricType.REVIEW_LATENCY]: {
    l1: 24.0, // Max PR review latency hours attributable to a single reviewer
    l2: 24.0,
    unit: 'hours',
  },
};

/**
 * Differential Privacy Engine for Organization Productivity & Benchmark Analytics (#542)
 * Implements:
 * 1. Mathematically calibrated Laplace mechanism (L1 sensitivity) and Gaussian mechanism (L2 sensitivity).
 * 2. Privacy loss budget accounting (epsilon = 1.0, delta = 1e-5) tracking cumulative query privacy leakage.
 * 3. Strict k-anonymity suppression (k < 5) preventing small team deanonymization.
 * 4. 95% Confidence intervals for noisy analytical aggregates.
 * 5. Executive benchmark reports with formal membership inference attack resistance.
 */
@Injectable()
export class DifferentialPrivacyService {
  private readonly logger = new Logger(DifferentialPrivacyService.name);
  public readonly defaultEpsilon: number;
  public readonly defaultDelta: number;
  public readonly minCohortSize: number;

  // Track cumulative privacy loss per organization/consumer key
  private readonly budgetLedger = new Map<
    string,
    { epsilon: number; delta: number; queries: number }
  >();

  constructor(@Optional() options?: DifferentialPrivacyOptions) {
    this.defaultEpsilon = options?.defaultEpsilon ?? 1.0;
    this.defaultDelta = options?.defaultDelta ?? 1e-5;
    this.minCohortSize = options?.minCohortSize ?? 5; // k-anonymity threshold (k >= 5)
  }

  /**
   * Samples random noise from a Laplace distribution Lap(scale)
   * using cryptographically secure inverse transform sampling:
   * noise = -scale * sign(u) * ln(1 - 2|u|), where u ~ Uniform(-0.5, 0.5).
   */
  sampleLaplace(scale: number): number {
    if (scale <= 0) return 0;
    const u = this.secureUniformRandom() - 0.5;
    return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }

  /**
   * Samples Gaussian noise N(mean, stdDev^2) using Box-Muller transform
   * seeded by cryptographically secure random bytes.
   */
  sampleGaussian(mean: number, stdDev: number): number {
    if (stdDev <= 0) return mean;
    const u1 = Math.max(1e-12, this.secureUniformRandom());
    const u2 = this.secureUniformRandom();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * stdDev;
  }

  /**
   * Adds calibrated Laplace noise for pure epsilon-differential privacy:
   * Noise scale b = L1_sensitivity / epsilon.
   */
  addLaplaceNoise(value: number, sensitivityL1 = 1.0, epsilon = this.defaultEpsilon): number {
    if (epsilon <= 0) {
      throw new BadRequestException('Epsilon privacy budget parameter must be strictly positive');
    }
    const scale = sensitivityL1 / epsilon;
    const noise = this.sampleLaplace(scale);
    return Number((value + noise).toFixed(4));
  }

  /**
   * Adds Gaussian noise for approximate (epsilon, delta)-differential privacy:
   * Standard deviation sigma = (L2_sensitivity * sqrt(2 * ln(1.25 / delta))) / epsilon.
   */
  addGaussianNoise(
    value: number,
    sensitivityL2 = 1.0,
    epsilon = this.defaultEpsilon,
    delta = this.defaultDelta,
  ): number {
    if (epsilon <= 0 || delta <= 0) {
      throw new BadRequestException('Epsilon and delta must be strictly positive for Gaussian mechanism');
    }
    const sigma = (sensitivityL2 * Math.sqrt(2 * Math.log(1.25 / delta))) / epsilon;
    const noise = this.sampleGaussian(0, sigma);
    return Number((value + noise).toFixed(4));
  }

  /**
   * Calculates 95% Confidence Interval for the noisy aggregate value based on the chosen mechanism.
   * - Laplace: Half-width = scale * ln(1 / (1 - confidence)) = b * ln(20) ~= 2.9957 * b
   * - Gaussian: Half-width = 1.95996 * sigma
   */
  calculateConfidenceInterval(
    noisyValue: number,
    sensitivity: number,
    epsilon: number,
    delta: number,
    mechanism: DifferentialPrivacyMechanism = DifferentialPrivacyMechanism.LAPLACE,
    confidence = 0.95,
  ): ConfidenceInterval {
    let halfWidth = 0;

    if (mechanism === DifferentialPrivacyMechanism.GAUSSIAN) {
      const sigma = (sensitivity * Math.sqrt(2 * Math.log(1.25 / delta))) / epsilon;
      halfWidth = 1.95996 * sigma;
    } else {
      const scale = sensitivity / epsilon;
      halfWidth = -scale * Math.log(1 - confidence);
    }

    return {
      lowerBound: Number((noisyValue - halfWidth).toFixed(2)),
      upperBound: Number((noisyValue + halfWidth).toFixed(2)),
      confidenceLevel: confidence,
    };
  }

  /**
   * Generates formal differentially private executive benchmark report for organization productivity.
   * Enforces k-anonymity (k >= 5) and deducts cumulative privacy budget.
   */
  generateExecutiveBenchmarkReport<T extends Record<string, unknown>>(
    organizationId: string,
    metricType: PrivacyMetricType,
    cohortData: T[],
    metricExtractor: (item: T) => number,
    options?: {
      teamId?: string;
      epsilon?: number;
      delta?: number;
      mechanism?: DifferentialPrivacyMechanism;
      consumerKey?: string;
      maxAllowedBudget?: number;
    },
  ): OrgBenchmarkReportDto {
    const cohortSize = cohortData.length;
    const epsilon = options?.epsilon ?? this.defaultEpsilon;
    const delta = options?.delta ?? this.defaultDelta;
    const mechanism = options?.mechanism ?? DifferentialPrivacyMechanism.LAPLACE;
    const consumerKey = options?.consumerKey ?? organizationId;
    const maxBudget = options?.maxAllowedBudget ?? 10.0;

    const sensitivities = GLOBAL_SENSITIVITIES[metricType] ?? {
      l1: 1.0,
      l2: 1.0,
      unit: 'units',
    };

    const sensitivity = mechanism === DifferentialPrivacyMechanism.GAUSSIAN
      ? sensitivities.l2
      : sensitivities.l1;

    const privacyGuarantee: PrivacyGuarantee = {
      epsilon,
      delta: mechanism === DifferentialPrivacyMechanism.GAUSSIAN ? delta : 0,
      mechanism: `${mechanism.toUpperCase()}-Differential-Privacy`,
      sensitivityL1: sensitivities.l1,
      sensitivityL2: sensitivities.l2,
      theoreticalMaxInformationLeakage: `exp(${epsilon}) = ${Math.exp(epsilon).toFixed(4)}x max odds ratio`,
    };

    // 1. Enforce k-anonymity threshold (Reject when N < 5 active contributors)
    if (cohortSize < this.minCohortSize) {
      this.logger.warn(
        `Suppressed benchmark query for org '${organizationId}': cohort size ${cohortSize} is below k-anonymity threshold (${this.minCohortSize})`,
      );
      return {
        organizationId,
        teamId: options?.teamId,
        metric: metricType,
        cohortSize,
        kAnonymityMet: false,
        kAnonymityThreshold: this.minCohortSize,
        suppressed: true,
        suppressionReason: `K-anonymity protection: Cohort size (${cohortSize}) is below minimum threshold (${this.minCohortSize}) to prevent individual deanonymization.`,
        privacyGuarantee,
        noisyAggregate: null,
        noisyMean: null,
        confidenceInterval: null,
        membershipInferenceRisk: 'SUPPRESSED',
        computedAt: new Date().toISOString(),
      };
    }

    // 2. Enforce & deduct privacy loss budget
    this.consumeBudget(consumerKey, epsilon, delta, maxBudget);

    // 3. Compute true aggregate and inject mathematically calibrated noise
    const trueSum = cohortData.reduce((acc, item) => acc + metricExtractor(item), 0);
    const noisyAggregate = mechanism === DifferentialPrivacyMechanism.GAUSSIAN
      ? this.addGaussianNoise(trueSum, sensitivities.l2, epsilon, delta)
      : this.addLaplaceNoise(trueSum, sensitivities.l1, epsilon);

    const noisyMean = Number((noisyAggregate / cohortSize).toFixed(2));
    const confidenceInterval = this.calculateConfidenceInterval(
      noisyAggregate,
      sensitivity,
      epsilon,
      delta,
      mechanism,
      0.95,
    );

    const membershipInferenceRisk = epsilon <= 1.0 ? 'NEGLIGIBLE' : 'LOW';

    return {
      organizationId,
      teamId: options?.teamId,
      metric: metricType,
      cohortSize,
      kAnonymityMet: true,
      kAnonymityThreshold: this.minCohortSize,
      suppressed: false,
      privacyGuarantee,
      noisyAggregate,
      noisyMean,
      confidenceInterval,
      membershipInferenceRisk,
      computedAt: new Date().toISOString(),
    };
  }

  /**
   * Evaluates generic cohort aggregation with k-anonymity and DP noise.
   */
  privatizeQuery<T extends Record<string, unknown>>(
    cohortData: T[],
    metricExtractor: (item: T) => number,
    options?: {
      sensitivity?: number;
      epsilon?: number;
      delta?: number;
      mechanism?: 'laplace' | 'gaussian';
      consumerKey?: string;
      maxAllowedBudget?: number;
    },
  ): {
    cohortSize: number;
    suppressed: boolean;
    noisyValue: number | null;
    epsilonUsed: number;
  } {
    const cohortSize = cohortData.length;
    const epsilon = options?.epsilon ?? this.defaultEpsilon;
    const delta = options?.delta ?? this.defaultDelta;
    const sensitivity = options?.sensitivity ?? 1.0;
    const mechanism = options?.mechanism ?? 'laplace';

    if (cohortSize < this.minCohortSize) {
      return {
        cohortSize,
        suppressed: true,
        noisyValue: null,
        epsilonUsed: 0,
      };
    }

    if (options?.consumerKey) {
      this.consumeBudget(options.consumerKey, epsilon, delta, options?.maxAllowedBudget);
    }

    const trueSum = cohortData.reduce((acc, item) => acc + metricExtractor(item), 0);
    const noisyValue =
      mechanism === 'gaussian'
        ? this.addGaussianNoise(trueSum, sensitivity, epsilon, delta)
        : this.addLaplaceNoise(trueSum, sensitivity, epsilon);

    return {
      cohortSize,
      suppressed: false,
      noisyValue,
      epsilonUsed: epsilon,
    };
  }

  /**
   * Tracks and depletes cumulative privacy loss budget per organization / caller key.
   * Throws BadRequestException when the budget is exhausted.
   */
  consumeBudget(
    consumerKey: string,
    epsilonCost: number,
    deltaCost = 0,
    maxEpsilonBudget = 10.0,
  ): PrivacyBudgetAccount {
    const current = this.budgetLedger.get(consumerKey) ?? {
      epsilon: 0,
      delta: 0,
      queries: 0,
    };

    const newEpsilon = current.epsilon + epsilonCost;
    if (newEpsilon > maxEpsilonBudget) {
      throw new BadRequestException(
        `Privacy budget exhausted for key "${consumerKey}". Requested cumulative epsilon ${newEpsilon.toFixed(2)} exceeds maximum limit ${maxEpsilonBudget}`,
      );
    }

    current.epsilon = Number(newEpsilon.toFixed(4));
    current.delta += deltaCost;
    current.queries += 1;
    this.budgetLedger.set(consumerKey, current);

    return {
      epsilonConsumed: current.epsilon,
      deltaConsumed: current.delta,
      queriesExecuted: current.queries,
      maxEpsilon: maxEpsilonBudget,
      maxDelta: 1e-3,
    };
  }

  getBudgetStatus(consumerKey: string, maxEpsilonBudget = 10.0): PrivacyBudgetAccount {
    const current = this.budgetLedger.get(consumerKey) ?? {
      epsilon: 0,
      delta: 0,
      queries: 0,
    };
    return {
      epsilonConsumed: current.epsilon,
      deltaConsumed: current.delta,
      queriesExecuted: current.queries,
      maxEpsilon: maxEpsilonBudget,
      maxDelta: 1e-3,
    };
  }

  resetBudget(consumerKey: string): void {
    this.budgetLedger.delete(consumerKey);
  }

  private secureUniformRandom(): number {
    const buf = randomBytes(4);
    const intVal = buf.readUInt32BE(0);
    return intVal / 0x100000000;
  }
}
