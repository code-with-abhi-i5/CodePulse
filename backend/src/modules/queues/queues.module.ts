import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DeadLetterQueueService } from './dlq.service';
import { QueuesController } from './queues.controller';
import { QueuesAdminGuard } from './queues-admin.guard';
import { RETRY_POLICY, ALL_QUEUES } from './queue-policy';
import { QueueManagerService } from './queue-manager.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisService } from '../../common/redis/redis.service';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue(
      ...ALL_QUEUES.map((name) => ({
        name,
        defaultJobOptions: RETRY_POLICY,
      })),
      { name: 'dead-letter' },
    ),
  ],
  controllers: [QueuesController],
  providers: [DeadLetterQueueService, QueueManagerService, QueuesAdminGuard, RedisService],
  exports: [BullModule, DeadLetterQueueService, QueueManagerService],
})
export class QueuesModule {}
