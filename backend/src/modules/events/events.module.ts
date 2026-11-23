import { Module } from '@nestjs/common';
import { EventStoreService } from './event-store.service';
import { BattleReadProjection } from './projections/battle-read.projection';
import { EloReadProjection } from './projections/elo-read.projection';
import { CdcDispatcherService } from './cdc-dispatcher.service';
import { RedisService } from '../../common/redis/redis.service';
import { StickyAssignorService } from './sticky-assignor.service';
import { PartitionRebalanceManagerService } from './partition-rebalance-manager.service';

@Module({
  providers: [
    EventStoreService,
    BattleReadProjection,
    EloReadProjection,
    CdcDispatcherService,
    RedisService,
    StickyAssignorService,
    PartitionRebalanceManagerService,
  ],
  exports: [
    EventStoreService,
    BattleReadProjection,
    EloReadProjection,
    CdcDispatcherService,
    StickyAssignorService,
    PartitionRebalanceManagerService,
  ],
})
export class EventsModule {}
