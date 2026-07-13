import { Module } from '@nestjs/common';
import { ChallengesController } from './challenges.controller';
import { ChallengesService } from './challenges.service';

import { BullModule } from '@nestjs/bullmq';
import { ChallengesWorker } from './challenges.worker';
import { ChallengesScheduler } from './challenges.scheduler';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'challenges',
    }),
  ],
  controllers: [ChallengesController],
  providers: [ChallengesService, ChallengesWorker, ChallengesScheduler],
  exports: [ChallengesService],
})
export class ChallengesModule {}
