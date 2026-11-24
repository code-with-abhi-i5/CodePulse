/**
 * @file bullmq-sharded-distributed-job.module.ts
 * @description NestJS module configuring [EVENT-BULLMQ-124]: BullMQ Sharded Distributed Job Scheduler with Redis Cluster Lock Isolation.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { BullmqShardedDistributedJobService } from './bullmq-sharded-distributed-job.service';
import { BullmqShardedDistributedJobController } from './bullmq-sharded-distributed-job.controller';

@Module({
  controllers: [BullmqShardedDistributedJobController],
  providers: [BullmqShardedDistributedJobService],
  exports: [BullmqShardedDistributedJobService],
})
export class BullmqShardedDistributedJobModule {}
