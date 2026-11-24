/**
 * @file threat-aware-rate-limiter.module.ts
 * @description NestJS module configuring [NET-THROTTLER-085]: Adaptive Distributed Token-Bucket Rate Limiter with ASN & Threat Reputation Scoring.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { ThreatAwareRateLimiterService } from './threat-aware-rate-limiter.service';
import { ThreatAwareRateLimiterController } from './threat-aware-rate-limiter.controller';

@Module({
  controllers: [ThreatAwareRateLimiterController],
  providers: [ThreatAwareRateLimiterService],
  exports: [ThreatAwareRateLimiterService],
})
export class ThreatAwareRateLimiterModule {}
