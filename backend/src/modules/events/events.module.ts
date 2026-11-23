import { Module } from '@nestjs/common';
import { EventStoreService } from './event-store.service';
import { BattleReadProjection } from './projections/battle-read.projection';
import { EloReadProjection } from './projections/elo-read.projection';
import { CdcDispatcherService } from './cdc-dispatcher.service';
import { RedisService } from '../../common/redis/redis.service';
import { RetryJitterService } from './retry-jitter.service';
import { OutboxPublisherService } from './outbox-publisher.service';

@Module({
  providers: [
    EventStoreService,
    BattleReadProjection,
    EloReadProjection,
    CdcDispatcherService,
    RedisService,
    RetryJitterService,
    OutboxPublisherService,
  ],
  exports: [
    EventStoreService,
    BattleReadProjection,
    EloReadProjection,
    CdcDispatcherService,
    RetryJitterService,
    OutboxPublisherService,
  ],
})
export class EventsModule {}
