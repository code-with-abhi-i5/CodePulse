import { Module } from '@nestjs/common';
import { BattlesController } from './battles.controller';
import { BattlesService } from './battles.service';
import { BattlesGateway } from './battles.gateway';
import { SeasonResetService } from './season-reset.service';
import { BullModule } from '@nestjs/bullmq';
import { RatingDecayService } from './rating-decay.service';
import { RatingDecayWorker } from './rating-decay.worker';
import { RatingDecayScheduler } from './rating-decay.scheduler';
import { BattlesLifecycleScheduler } from './battles-lifecycle.scheduler';
import { BattlesLifecycleWorker } from './battles-lifecycle.worker';
import { MetricsModule } from '../metrics/metrics.module';
import { XpModule } from '../xp/xp.module';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'rating-decay' },
      { name: 'battles-lifecycle' },
    ),
    MetricsModule,
    XpModule,
  ],
  controllers: [BattlesController],
  providers: [
    BattlesService,
    BattlesGateway,
    SeasonResetService,
    RatingDecayService,
    RatingDecayWorker,
    RatingDecayScheduler,
    BattlesLifecycleScheduler,
    BattlesLifecycleWorker,
  ],
  exports: [BattlesService, BattlesGateway],
})
export class BattlesModule {}
