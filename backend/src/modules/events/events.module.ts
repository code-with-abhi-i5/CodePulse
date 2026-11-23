import { Module } from '@nestjs/common';
import { EventStoreService } from './event-store.service';
import { BattleReadProjection } from './projections/battle-read.projection';
import { EloReadProjection } from './projections/elo-read.projection';
import { CdcDispatcherService } from './cdc-dispatcher.service';
import { RedisService } from '../../common/redis/redis.service';
import { CachePreloaderService } from './cache-preloader.service';
import { CacheWarmingSubscriberService } from './cache-warming-subscriber.service';

@Module({
  providers: [
    EventStoreService,
    BattleReadProjection,
    EloReadProjection,
    CdcDispatcherService,
    RedisService,
    CachePreloaderService,
    CacheWarmingSubscriberService,
  ],
  exports: [
    EventStoreService,
    BattleReadProjection,
    EloReadProjection,
    CdcDispatcherService,
    CachePreloaderService,
    CacheWarmingSubscriberService,
  ],
})
export class EventsModule {}
