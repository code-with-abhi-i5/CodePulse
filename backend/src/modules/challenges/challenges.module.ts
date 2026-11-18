import { Module } from '@nestjs/common';
import { ChallengesController } from './challenges.controller';
import { ChallengesService } from './challenges.service';

import { QueuesModule } from '../queues/queues.module';
import { ChallengesWorker } from './challenges.worker';
import { ChallengesScheduler } from './challenges.scheduler';
import { XpModule } from '../xp/xp.module';

@Module({
  imports: [QueuesModule, XpModule],
  controllers: [ChallengesController],
  providers: [ChallengesService, ChallengesWorker, ChallengesScheduler],
  exports: [ChallengesService],
})
export class ChallengesModule {}
