import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BattlesService } from './battles.service';

@Processor('battles-lifecycle')
export class BattlesLifecycleWorker extends WorkerHost {
  private readonly logger = new Logger(BattlesLifecycleWorker.name);

  constructor(private readonly battlesService: BattlesService) {
    super();
  }

  async process(job: Job): Promise<{ expiredCount: number; forfeitedCount: number }> {
    if (job.name === 'cleanup-expired-battles') {
      const result = await this.battlesService.expireStaleBattles();
      if (result.expiredCount > 0 || result.forfeitedCount > 0) {
        this.logger.log(
          `Battle lifecycle cleanup: ${result.expiredCount} expired, ${result.forfeitedCount} forfeited`,
        );
      }
      return result;
    }
    throw new Error(`Unknown battle lifecycle job: ${job.name}`);
  }
}
