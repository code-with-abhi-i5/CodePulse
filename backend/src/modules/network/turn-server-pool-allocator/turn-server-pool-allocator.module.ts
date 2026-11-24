/**
 * @file turn-server-pool-allocator.module.ts
 * @description NestJS module configuring [NET-TURN-093]: Automated Coturn STUN/TURN Server Pool Allocator with Geo-DNS Health Probing.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { TurnServerPoolAllocatorService } from './turn-server-pool-allocator.service';
import { TurnServerPoolAllocatorController } from './turn-server-pool-allocator.controller';

@Module({
  controllers: [TurnServerPoolAllocatorController],
  providers: [TurnServerPoolAllocatorService],
  exports: [TurnServerPoolAllocatorService],
})
export class TurnServerPoolAllocatorModule {}
