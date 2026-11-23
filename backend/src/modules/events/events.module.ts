import { Module } from '@nestjs/common';
import { EventStoreService } from './event-store.service';
import { BattleReadProjection } from './projections/battle-read.projection';
import { EloReadProjection } from './projections/elo-read.projection';
import { CdcDispatcherService } from './cdc-dispatcher.service';
import { RedisService } from '../../common/redis/redis.service';
import { CompensationRunnerService } from './compensation-runner.service';
import { SagaOrchestratorService } from './saga-orchestrator.service';

@Module({
  providers: [
    EventStoreService,
    BattleReadProjection,
    EloReadProjection,
    CdcDispatcherService,
    RedisService,
    CompensationRunnerService,
    SagaOrchestratorService,
  ],
  exports: [
    EventStoreService,
    BattleReadProjection,
    EloReadProjection,
    CdcDispatcherService,
    CompensationRunnerService,
    SagaOrchestratorService,
  ],
})
export class EventsModule {}
