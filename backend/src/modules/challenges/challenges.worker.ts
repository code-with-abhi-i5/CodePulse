import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ChallengesService } from './challenges.service';

@Processor('challenges')
export class ChallengesWorker extends WorkerHost {
  private readonly logger = new Logger(ChallengesWorker.name);

  constructor(private readonly challengesService: ChallengesService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing challenge job: ${job.name}`);
    
    if (job.name === 'generate-daily-challenges') {
      await this.challengesService.generateDailyChallenges();
      this.logger.log('Daily challenges generated successfully via worker.');
    }
  }
}
