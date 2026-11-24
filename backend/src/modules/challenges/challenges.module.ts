import { Module } from '@nestjs/common';
import { ChallengesController } from './challenges.controller';
import { ChallengesService } from './challenges.service';
import { DifficultyCalibratorService } from './difficulty-calibrator.service';
import { BountyCalculatorService } from './bounty-calculator.service';
import { RewardMultiplierService } from './reward-multiplier.service';

import { QueuesModule } from '../queues/queues.module';
import { ChallengesWorker } from './challenges.worker';
import { ChallengesScheduler } from './challenges.scheduler';
import { XpModule } from '../xp/xp.module';
import { AiModule } from '../ai/ai.module';
import { HybridSearchService } from './hybrid-search.service';

@Module({
  imports: [QueuesModule, XpModule, AiModule],
  controllers: [ChallengesController],
  providers: [
    ChallengesService,
    ChallengesWorker,
    ChallengesScheduler,
    HybridSearchService,
    DifficultyCalibratorService,
    BountyCalculatorService,
    RewardMultiplierService,
  ],
  exports: [
    ChallengesService,
    HybridSearchService,
    DifficultyCalibratorService,
    BountyCalculatorService,
    RewardMultiplierService,
  ],
})
export class ChallengesModule {}
