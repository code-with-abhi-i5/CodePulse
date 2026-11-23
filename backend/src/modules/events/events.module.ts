import { Module } from '@nestjs/common';
import { EventStoreService } from './event-store.service';
import { BattleReadProjection } from './projections/battle-read.projection';
import { EloReadProjection } from './projections/elo-read.projection';
import { CdcDispatcherService } from './cdc-dispatcher.service';
import { RedisService } from '../../common/redis/redis.service';
import { ProtobufCompatibilityService } from './protobuf-compatibility.service';
import { SchemaRegistryService } from './schema-registry.service';

@Module({
  providers: [
    EventStoreService,
    BattleReadProjection,
    EloReadProjection,
    CdcDispatcherService,
    RedisService,
    ProtobufCompatibilityService,
    SchemaRegistryService,
  ],
  exports: [
    EventStoreService,
    BattleReadProjection,
    EloReadProjection,
    CdcDispatcherService,
    ProtobufCompatibilityService,
    SchemaRegistryService,
  ],
})
export class EventsModule {}
