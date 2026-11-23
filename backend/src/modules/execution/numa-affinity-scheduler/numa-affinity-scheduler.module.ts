/**
 * @file numa-affinity-scheduler.module.ts
 * @description NestJS module configuring [SANDBOX-NUMA-051]: NUMA-Aware CPU Pinning & Core Affinity Scheduler for Deterministic Code Benchmarking.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { NumaAffinitySchedulerService } from './numa-affinity-scheduler.service';
import { NumaAffinitySchedulerController } from './numa-affinity-scheduler.controller';

@Module({
  controllers: [NumaAffinitySchedulerController],
  providers: [NumaAffinitySchedulerService],
  exports: [NumaAffinitySchedulerService],
})
export class NumaAffinitySchedulerModule {}
