/**
 * @file packet-deduplication-layer.module.ts
 * @description NestJS module configuring [NET-DEDUPLICATION-098]: Sliding-Window Sequence Ordering & Packet Deduplication Layer for UDP Game Feeds.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { PacketDeduplicationLayerService } from './packet-deduplication-layer.service';
import { PacketDeduplicationLayerController } from './packet-deduplication-layer.controller';

@Module({
  controllers: [PacketDeduplicationLayerController],
  providers: [PacketDeduplicationLayerService],
  exports: [PacketDeduplicationLayerService],
})
export class PacketDeduplicationLayerModule {}
