import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { GithubSyncService } from './github-sync.service';
import { RankingService } from './ranking.service';
import { CountryNormalizerService } from './country-normalizer.service';
import type { Cache } from 'cache-manager';
export declare class LeaderboardWorker extends WorkerHost {
    private readonly prisma;
    private readonly githubSync;
    private readonly ranking;
    private readonly normalizer;
    private cacheManager;
    private readonly logger;
    constructor(prisma: PrismaService, githubSync: GithubSyncService, ranking: RankingService, normalizer: CountryNormalizerService, cacheManager: Cache);
    process(job: Job<any, any, string>): Promise<any>;
    private syncUser;
    private syncStaleUsers;
}
