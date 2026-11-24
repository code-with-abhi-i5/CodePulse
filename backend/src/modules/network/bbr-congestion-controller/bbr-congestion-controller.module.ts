/**
 * @file bbr-congestion-controller.module.ts
 * @description NestJS module configuring [NET-BBR-090]: WebTransport Congestion Control Tuning (BBRv2) for High-Jitter Esports Broadcast Feeds.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { BbrCongestionControllerService } from './bbr-congestion-controller.service';
import { BbrCongestionControllerController } from './bbr-congestion-controller.controller';

@Module({
  controllers: [BbrCongestionControllerController],
  providers: [BbrCongestionControllerService],
  exports: [BbrCongestionControllerService],
})
export class BbrCongestionControllerModule {}
