import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncCronService } from './sync.cron';
import { GithubModule } from '../github/github.module';
import { QueuesModule } from '../queues/queues.module';
import { SyncWorker } from './sync.worker';
import { RedisStreamsModule } from '../../common/redis/redis-streams.module';
import { StreamWorkerService } from './stream-worker.service';
import { PostgresWalListenerService } from './postgres-wal-listener.service';
import { CdcEventRouterService } from './cdc-event-router.service';

@Module({
  imports: [GithubModule, QueuesModule, RedisStreamsModule],
  providers: [
    SyncService,
    SyncCronService,
    SyncWorker,
    StreamWorkerService,
    PostgresWalListenerService,
    CdcEventRouterService,
  ],
  exports: [
    SyncService,
    SyncCronService,
    StreamWorkerService,
    PostgresWalListenerService,
    CdcEventRouterService,
  ],
})
export class SyncModule {}
