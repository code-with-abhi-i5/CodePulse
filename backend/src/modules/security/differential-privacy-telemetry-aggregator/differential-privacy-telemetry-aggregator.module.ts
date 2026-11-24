/**
 * @file differential-privacy-telemetry-aggregator.module.ts
 * @description NestJS module configuring [SEC-DIFF-PRIVACY-106]: Differential Privacy Telemetry Aggregator Injecting Calibrated Laplace Noise on Analytics.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { DifferentialPrivacyTelemetryAggregatorService } from './differential-privacy-telemetry-aggregator.service';
import { DifferentialPrivacyTelemetryAggregatorController } from './differential-privacy-telemetry-aggregator.controller';

@Module({
  controllers: [DifferentialPrivacyTelemetryAggregatorController],
  providers: [DifferentialPrivacyTelemetryAggregatorService],
  exports: [DifferentialPrivacyTelemetryAggregatorService],
})
export class DifferentialPrivacyTelemetryAggregatorModule {}
