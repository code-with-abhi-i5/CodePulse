import { Module, Global } from '@nestjs/common';
import { SystemMetricsService } from './services/system-metrics.service';
import { LoadShedderMiddleware } from './middleware/load-shedder.middleware';
import { DisruptorRingBuffer } from './concurrency/disruptor-ring-buffer';
import { ZeroCopyStreamService } from './concurrency/zero-copy-stream.service';
import { EtcdWatcherService } from '../config/etcd-watcher.service';
import { IdempotencyService } from './idempotency/idempotency.service';
import { IdempotencyInterceptor } from './idempotency/idempotency.interceptor';
import { QuorumWitnessService } from './cluster/quorum-witness.service';
import { SplitBrainDetectorService } from './cluster/split-brain-detector.service';
import { NodeFenceController } from './cluster/node-fence.controller';
import { NodeRegistryService } from './cluster/node-registry.service';
import { SwimGossipService } from './cluster/swim-gossip.service';
import { SwimGossipController } from './cluster/swim-gossip.controller';
import { BinaryWalService } from './storage/binary-wal.service';
import { WalCompactorService } from './storage/wal-compactor.service';
import { BinaryWalController } from './storage/binary-wal.controller';
import { EventLoopWatchdogService } from './performance/event-loop-watchdog.service';
import { TaskSharderService } from './performance/task-sharder.service';
import { EventLoopWatchdogController } from './performance/event-loop-watchdog.controller';
import { WorkStealingPoolService } from './concurrency/work-stealing-pool.service';
import { WorkStealingPoolController } from './concurrency/work-stealing-pool.controller';
import { ReplicaRouter } from './db/replica-router';
import { FeatureFlagService } from './features/feature-flag.service';
import { LoadShedderService } from './resilience/load-shedder.service';
import { DistributedDeadlockDetectorService } from './concurrency/deadlock-detector.service';

import { CloudEventsProvider } from './events/cloudevents.provider';
import { NatsJetStreamService } from './events/nats-jetstream.service';
import { TDigestService } from './math/t-digest.service';
import { ClocksModule } from './clocks/clocks.module';
import { SlidingBloomFilterService } from './cache/sliding-bloom-filter.service';
import { EventDeduplicatorService } from './cache/event-deduplicator.service';
import { RedlockService } from './redis/redlock.service';

@Global()
@Module({
  imports: [ClocksModule],
  controllers: [
    NodeFenceController,
    SwimGossipController,
    BinaryWalController,
    EventLoopWatchdogController,
    WorkStealingPoolController,
  ],
  providers: [
    SystemMetricsService,
    LoadShedderMiddleware,
    EtcdWatcherService,
    IdempotencyService,
    IdempotencyInterceptor,
    QuorumWitnessService,
    SplitBrainDetectorService,
    NodeRegistryService,
    SwimGossipService,
    BinaryWalService,
    WalCompactorService,
    EventLoopWatchdogService,
    TaskSharderService,
    WorkStealingPoolService,
    ZeroCopyStreamService,
    ReplicaRouter,
    FeatureFlagService,
    LoadShedderService,
    DistributedDeadlockDetectorService,

    CloudEventsProvider,
    NatsJetStreamService,
    TDigestService,
    SlidingBloomFilterService,
    EventDeduplicatorService,
    RedlockService,
  ],
  exports: [
    SystemMetricsService,
    LoadShedderMiddleware,
    EtcdWatcherService,
    IdempotencyService,
    IdempotencyInterceptor,
    QuorumWitnessService,
    SplitBrainDetectorService,
    NodeRegistryService,
    SwimGossipService,
    BinaryWalService,
    WalCompactorService,
    EventLoopWatchdogService,
    TaskSharderService,
    WorkStealingPoolService,
    ZeroCopyStreamService,
    ReplicaRouter,
    FeatureFlagService,
    LoadShedderService,
    DistributedDeadlockDetectorService,

    CloudEventsProvider,
    NatsJetStreamService,
    TDigestService,
    SlidingBloomFilterService,
    EventDeduplicatorService,
    RedlockService,
    ClocksModule,
  ],
})
export class CommonModule {}
