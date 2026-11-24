import { Module } from '@nestjs/common';
import { EventStoreService } from './event-store.service';
import { BattleReadProjection } from './projections/battle-read.projection';
import { EloReadProjection } from './projections/elo-read.projection';
import { CdcDispatcherService } from './cdc-dispatcher.service';
import { RedisService } from '../../common/redis/redis.service';
import { StickyAssignorService } from './sticky-assignor.service';
import { PartitionRebalanceManagerService } from './partition-rebalance-manager.service';
import { CompensationRunnerService } from './compensation-runner.service';
import { SagaOrchestratorService } from './saga-orchestrator.service';
import { ProtobufCompatibilityService } from './protobuf-compatibility.service';
import { SchemaRegistryService } from './schema-registry.service';
import { OutboxPublisherService } from './outbox-publisher.service';
import { RetryJitterService } from './retry-jitter.service';
import { LogCompactorService } from './log-compactor.service';
import { TombstoneCleanerService } from './tombstone-cleaner.service';
import { CachePreloaderService } from './cache-preloader.service';
import { CacheWarmingSubscriberService } from './cache-warming-subscriber.service';

@Module({
  providers: [
    EventStoreService,
    BattleReadProjection,
    EloReadProjection,
    CdcDispatcherService,
    RedisService,
    StickyAssignorService,
    PartitionRebalanceManagerService,
    CompensationRunnerService,
    SagaOrchestratorService,
    ProtobufCompatibilityService,
    SchemaRegistryService,
    OutboxPublisherService,
    RetryJitterService,
    LogCompactorService,
    TombstoneCleanerService,
    CachePreloaderService,
    CacheWarmingSubscriberService,
  ],
  exports: [
    EventStoreService,
    BattleReadProjection,
    EloReadProjection,
    CdcDispatcherService,
    StickyAssignorService,
    PartitionRebalanceManagerService,
    CompensationRunnerService,
    SagaOrchestratorService,
    ProtobufCompatibilityService,
    SchemaRegistryService,
    OutboxPublisherService,
    RetryJitterService,
    LogCompactorService,
    TombstoneCleanerService,
    CachePreloaderService,
    CacheWarmingSubscriberService,
  ],
})
export class EventsModule {}
