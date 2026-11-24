/**
 * @file deficit-round-robin-drr.module.ts
 * @description NestJS module configuring [EVENT-FAIR-SHARE-125]: Deficit Round Robin (DRR) Fair-Share Queue Scheduler for Multi-Tenant Submissions.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { DeficitRoundRobinDrrService } from './deficit-round-robin-drr.service';
import { DeficitRoundRobinDrrController } from './deficit-round-robin-drr.controller';

@Module({
  controllers: [DeficitRoundRobinDrrController],
  providers: [DeficitRoundRobinDrrService],
  exports: [DeficitRoundRobinDrrService],
})
export class DeficitRoundRobinDrrModule {}
