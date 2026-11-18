import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bullmq';

@Injectable()
export class BattlesLifecycleScheduler implements OnModuleInit {
  private readonly logger = new Logger(BattlesLifecycleScheduler.name);

  constructor(@InjectQueue('battles-lifecycle') private readonly queue: Queue) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.queue.upsertJobScheduler(
        'cleanup-expired-battles',
        { pattern: '*/1 * * * *' },
        {
          name: 'cleanup-expired-battles',
          data: {},
          opts: { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
        },
      );
    } catch (err) {
      this.logger.warn(`Could not register BullMQ job scheduler: ${err}`);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async triggerPeriodicCleanup(): Promise<void> {
    try {
      await this.queue.add(
        'cleanup-expired-battles',
        {},
        { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
      );
    } catch (err) {
      this.logger.warn(`Could not enqueue cleanup-expired-battles: ${err}`);
    }
  }
}
