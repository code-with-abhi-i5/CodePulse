import type { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service';
import { Queue } from 'bullmq';
import { GithubSyncService } from './github-sync.service';
export declare class LeaderboardsService {
    private readonly prisma;
    private cacheManager;
    private readonly syncQueue;
    private readonly githubSync;
    private readonly logger;
    constructor(prisma: PrismaService, cacheManager: Cache, syncQueue: Queue, githubSync: GithubSyncService);
    getGlobalLeaderboard(cursor?: string, limit?: number): Promise<{}>;
    getIndiaLeaderboard(cursor?: string, limit?: number): Promise<{}>;
    getFriendsLeaderboard(userId: string, cursor?: string, limit?: number): Promise<{}>;
    searchProfile(username: string): Promise<{
        id: string;
        githubId: string;
        username: string;
        name: string | null;
        bio: string | null;
        location: string | null;
        company: string | null;
        updatedAt: Date;
        following: number;
        followers: number;
        totalStars: number;
        totalForks: number;
        avatarUrl: string | null;
        country: string | null;
        primaryLanguage: string | null;
        publicRepos: number;
        score: number;
        lastSyncedAt: Date;
    } | null>;
}
