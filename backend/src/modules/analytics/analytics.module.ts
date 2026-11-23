import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { DifferentialPrivacyService } from './differential-privacy.service';
import { PrAnalyticsService } from './pr-analytics.service';
import { PrAnalyticsController } from './pr-analytics.controller';
import { BusFactorService } from './bus-factor.service';
import { RepositoryAuthorshipController } from './repository-authorship.controller';
import { ScyllaKeystrokeService } from './scylla-keystroke.service';
import { ScyllaDbTelemetryService } from './scylladb-telemetry.service';
import { ComplexityService } from './complexity.service';
import { GreenCarbonEstimatorService } from './green-carbon-estimator.service';
import { MonteCarloVelocityService } from './monte-carlo-velocity.service';
import { SkillMatrixService } from './skill-matrix.service';
import { ArchitecturalDriftService } from './architectural-drift.service';
import { DoraMetricsService } from './dora-metrics.service';
import { OwnershipHeatmapService } from './ownership-heatmap.service';
import { FlowStateService } from './flow-state.service';
import { TumblingWindowService } from './tumbling-window.service';
import { StreamAggregatorService } from './stream-aggregator.service';

@Module({
  controllers: [
    AnalyticsController,
    PrAnalyticsController,
    RepositoryAuthorshipController,
  ],
  providers: [
    DifferentialPrivacyService,
    AnalyticsService,
    PrAnalyticsService,
    BusFactorService,
    ScyllaKeystrokeService,
    ScyllaDbTelemetryService,
    ComplexityService,
    GreenCarbonEstimatorService,
    MonteCarloVelocityService,
    SkillMatrixService,
    ArchitecturalDriftService,
    DoraMetricsService,
    OwnershipHeatmapService,
    FlowStateService,
    TumblingWindowService,
    StreamAggregatorService,
  ],
  exports: [
    AnalyticsService,
    DifferentialPrivacyService,
    ScyllaKeystrokeService,
    ScyllaDbTelemetryService,
    ComplexityService,
    GreenCarbonEstimatorService,
    MonteCarloVelocityService,
    SkillMatrixService,
    ArchitecturalDriftService,
    DoraMetricsService,
    OwnershipHeatmapService,
    FlowStateService,
    TumblingWindowService,
    StreamAggregatorService,
  ],
})
export class AnalyticsModule {}
