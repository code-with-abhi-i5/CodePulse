/**
 * @file spectator-hype-aggregator.module.ts
 * @description NestJS module configuring [NET-HYPE-088]: Real-Time Spectator Hype Meter Stream Aggregator with Redis HyperLogLog & Stream Decay.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { SpectatorHypeAggregatorService } from './spectator-hype-aggregator.service';
import { SpectatorHypeAggregatorController } from './spectator-hype-aggregator.controller';

@Module({
  controllers: [SpectatorHypeAggregatorController],
  providers: [SpectatorHypeAggregatorService],
  exports: [SpectatorHypeAggregatorService],
})
export class SpectatorHypeAggregatorModule {}
