import { SecurityModule } from '../security/security.module';
import { Module } from '@nestjs/common';
import { QueuesModule } from '../queues/queues.module';
import { LeaderboardsController } from './leaderboards.controller';
import { LeaderboardsService } from './leaderboards.service';
import { GithubSyncService } from './github-sync.service';
import { RankingService } from './ranking.service';
import { CountryNormalizerService } from './country-normalizer.service';
import { LeaderboardWorker } from './leaderboard.worker';
import { ZscoreNormalizerService } from './zscore-normalizer.service';
import { ShardedLeaderboardService } from './sharded-leaderboard.service';
import { MaterializedViewRefreshService } from './materialized-view-refresh.service';
import { LeaderboardCqrsModule } from './cqrs/leaderboards-cqrs.module';

@Module({
  imports: [SecurityModule, QueuesModule, LeaderboardCqrsModule],
  controllers: [LeaderboardsController],
  providers: [
    LeaderboardsService,
    GithubSyncService,
    RankingService,
    CountryNormalizerService,
    LeaderboardWorker,
    ZscoreNormalizerService,
    ShardedLeaderboardService,
    MaterializedViewRefreshService,
  ],
  exports: [
    LeaderboardsService,
    ZscoreNormalizerService,
    ShardedLeaderboardService,
    MaterializedViewRefreshService,
    LeaderboardCqrsModule,
  ],
})
export class LeaderboardsModule {}
