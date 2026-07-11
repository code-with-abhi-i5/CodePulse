import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GithubSyncService } from './github-sync.service';
import { RankingService } from './ranking.service';
import { CountryNormalizerService } from './country-normalizer.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Processor('leaderboard-sync')
export class LeaderboardWorker extends WorkerHost {
  private readonly logger = new Logger(LeaderboardWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly githubSync: GithubSyncService,
    private readonly ranking: RankingService,
    private readonly normalizer: CountryNormalizerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job: ${job.name}`);
    
    if (job.name === 'sync-user') {
      const { username, overrideToken } = job.data;
      return this.syncUser(username, overrideToken);
    }

    if (job.name === 'daily-sync') {
      return this.syncStaleUsers();
    }
  }

  private async syncUser(username: string, overrideToken?: string) {
    this.logger.log(`Syncing user: ${username}`);
    const stats = await this.githubSync.fetchPublicStats(username, overrideToken);
    
    if (!stats) {
      this.logger.warn(`Could not fetch stats for ${username}`);
      return;
    }

    const score = this.ranking.calculateScore(stats);
    const country = this.normalizer.normalize(stats.location);

    await this.prisma.githubUser.upsert({
      where: { username: stats.username },
      update: {
        name: stats.name,
        avatarUrl: stats.avatarUrl,
        bio: stats.bio,
        company: stats.company,
        location: stats.location,
        country,
        primaryLanguage: stats.primaryLanguage,
        followers: stats.followers,
        following: stats.following,
        publicRepos: stats.publicRepos,
        totalStars: stats.totalStars,
        totalForks: stats.totalForks,
        score,
        lastSyncedAt: new Date(),
      },
      create: {
        githubId: stats.githubId,
        username: stats.username,
        name: stats.name,
        avatarUrl: stats.avatarUrl,
        bio: stats.bio,
        company: stats.company,
        location: stats.location,
        country,
        primaryLanguage: stats.primaryLanguage,
        followers: stats.followers,
        following: stats.following,
        publicRepos: stats.publicRepos,
        totalStars: stats.totalStars,
        totalForks: stats.totalForks,
        score,
      },
    });

    // Cache invalidation has been removed as the leaderboard keys
    // expire automatically in 10 minutes via TTL.

    this.logger.log(`Successfully synced ${username}`);
  }

  private async syncStaleUsers() {
    this.logger.log('Starting daily sync for stale users');
    // Find users who haven't been synced in 24 hours
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const staleUsers = await this.prisma.githubUser.findMany({
      where: {
        lastSyncedAt: { lt: yesterday }
      },
      orderBy: { score: 'desc' },
      take: 100 // Process top 100 stale users per batch to avoid rate limits
    });

    for (const user of staleUsers) {
      // Small delay to prevent rate limit hitting too fast
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.syncUser(user.username);
    }
    
    this.logger.log('Finished daily sync batch');
  }
}
