import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { DeadLetterQueueService } from '../queues/dlq.service';

@Processor('challenges')
export class ChallengesWorker extends WorkerHost {
  private readonly logger = new Logger(ChallengesWorker.name);

  constructor(
    private readonly challengesService: ChallengesService,
    private readonly dlq: DeadLetterQueueService,
  ) {
    super();
  }

  @OnWorkerEvent('failed')
  failed(job: Job | undefined, error: Error) {
    return this.dlq.capture(job, error);
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing challenge job: ${job.name}`);

    if (job.name === 'generate-daily-challenges') {
      await this.challengesService.generateDailyChallenges();
      this.logger.log('Daily challenges generated successfully via worker.');
    } else if (job.name === 'cleanup-expired-challenges') {
      const result = await this.challengesService.archiveExpiredChallenges();
      this.logger.log(
        `Archived ${result.expiredUserChallengesCount} expired user challenges.`,
      );
      return result;
    }
  }
}
