import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ChallengesScheduler {
  private readonly logger = new Logger(ChallengesScheduler.name);

  constructor(@InjectQueue('challenges') private readonly challengesQueue: Queue) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async scheduleDailyChallenges() {
    this.logger.log('Scheduling daily challenges generation...');
    await this.challengesQueue.add('generate-daily-challenges', {});
  }
}
