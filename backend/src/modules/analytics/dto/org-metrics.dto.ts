import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PrivacyMetricType {
  DEVELOPER_SPEED = 'DEVELOPER_SPEED', // CPM (Characters Per Minute typing speed)
  COMMIT_VOLUME = 'COMMIT_VOLUME',     // Commits per developer
  CODE_CHURN = 'CODE_CHURN',           // Lines of code modified
  TEST_SCORE = 'TEST_SCORE',           // Battle/Challenge score points
  REVIEW_LATENCY = 'REVIEW_LATENCY',   // Hours to review PR
}

export enum DifferentialPrivacyMechanism {
  LAPLACE = 'laplace',
  GAUSSIAN = 'gaussian',
}

export class OrgProductivityQueryDto {
  @ApiProperty({ description: 'Organization or tenant ID' })
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @ApiPropertyOptional({ description: 'Optional sub-team or repository filter' })
  @IsString()
  @IsOptional()
  teamId?: string;

  @ApiProperty({ enum: PrivacyMetricType, description: 'Productivity metric to analyze' })
  @IsEnum(PrivacyMetricType)
  metric: PrivacyMetricType;

  @ApiPropertyOptional({ default: 1.0, description: 'Epsilon privacy parameter (privacy loss budget)' })
  @IsNumber()
  @IsOptional()
  @Min(0.01)
  @Max(10.0)
  epsilon?: number;

  @ApiPropertyOptional({ default: 1e-5, description: 'Delta parameter (failure probability for Gaussian mechanism)' })
  @IsNumber()
  @IsOptional()
  @Min(1e-9)
  @Max(1e-2)
  delta?: number;

  @ApiPropertyOptional({
    enum: DifferentialPrivacyMechanism,
    default: DifferentialPrivacyMechanism.LAPLACE,
    description: 'Noise injection mechanism (Laplace or Gaussian)',
  })
  @IsEnum(DifferentialPrivacyMechanism)
  @IsOptional()
  mechanism?: DifferentialPrivacyMechanism;
}

export interface PrivacyGuarantee {
  epsilon: number;
  delta: number;
  mechanism: string;
  sensitivityL1: number;
  sensitivityL2: number;
  theoreticalMaxInformationLeakage: string;
}

export interface ConfidenceInterval {
  lowerBound: number;
  upperBound: number;
  confidenceLevel: number; // e.g. 0.95
}

export class OrgBenchmarkReportDto {
  organizationId: string;
  teamId?: string;
  metric: PrivacyMetricType;
  cohortSize: number;
  kAnonymityMet: boolean;
  kAnonymityThreshold: number;
  suppressed: boolean;
  suppressionReason?: string;
  privacyGuarantee: PrivacyGuarantee;
  noisyAggregate: number | null;
  noisyMean: number | null;
  confidenceInterval: ConfidenceInterval | null;
  membershipInferenceRisk: 'NEGLIGIBLE' | 'LOW' | 'SUPPRESSED';
  computedAt: string;
}
