/**
 * @file distributed-deadletter-queue-dlq.module.ts
 * @description NestJS module configuring [EVENT-DLQ-123]: Distributed Dead-Letter Queue (DLQ) Automated Poison-Pill Isolator & Replay Engine.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { DistributedDeadletterQueueDlqService } from './distributed-deadletter-queue-dlq.service';
import { DistributedDeadletterQueueDlqController } from './distributed-deadletter-queue-dlq.controller';

@Module({
  controllers: [DistributedDeadletterQueueDlqController],
  providers: [DistributedDeadletterQueueDlqService],
  exports: [DistributedDeadletterQueueDlqService],
})
export class DistributedDeadletterQueueDlqModule {}
