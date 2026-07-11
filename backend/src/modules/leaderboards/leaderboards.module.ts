import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { LeaderboardsController } from './leaderboards.controller';
import { LeaderboardsService } from './leaderboards.service';
import { GithubSyncService } from './github-sync.service';
import { RankingService } from './ranking.service';
import { CountryNormalizerService } from './country-normalizer.service';
import { LeaderboardWorker } from './leaderboard.worker';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'leaderboard-sync',
    }),
  ],
  controllers: [LeaderboardsController],
  providers: [
    LeaderboardsService,
    GithubSyncService,
    RankingService,
    CountryNormalizerService,
    LeaderboardWorker,
  ],
  exports: [LeaderboardsService],
})
export class LeaderboardsModule {}
