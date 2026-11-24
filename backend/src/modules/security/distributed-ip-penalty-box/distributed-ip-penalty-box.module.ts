/**
 * @file distributed-ip-penalty-box.module.ts
 * @description NestJS module configuring [SEC-PENALTY-BOX-117]: Distributed IP Penalty Box & Sliding-Window Exponential Tarpit Defense for Brute Force.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { DistributedIpPenaltyBoxService } from './distributed-ip-penalty-box.service';
import { DistributedIpPenaltyBoxController } from './distributed-ip-penalty-box.controller';

@Module({
  controllers: [DistributedIpPenaltyBoxController],
  providers: [DistributedIpPenaltyBoxService],
  exports: [DistributedIpPenaltyBoxService],
})
export class DistributedIpPenaltyBoxModule {}
