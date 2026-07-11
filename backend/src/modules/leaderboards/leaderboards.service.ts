import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { GithubSyncService } from './github-sync.service';

@Injectable()
export class LeaderboardsService {
  private readonly logger = new Logger(LeaderboardsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectQueue('leaderboard-sync') private readonly syncQueue: Queue,
    private readonly githubSync: GithubSyncService,
  ) {}

  async getGlobalLeaderboard(cursor?: string, limit: number = 20) {
    const cacheKey = `leaderboard:global:${cursor || 'first'}:${limit}`;
    const cachedData = await this.cacheManager.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const data = await this.prisma.githubUser.findMany({
      take: limit + 1, // +1 for next cursor
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { score: 'desc' },
    });

    let nextCursor = null;
    if (data.length > limit) {
      const nextItem = data.pop();
      if (nextItem) nextCursor = nextItem.id;
    }

    const result = { data, nextCursor };
    // Cache for 10 minutes
    await this.cacheManager.set(cacheKey, result, 600000); 

    return result;
  }

  async getIndiaLeaderboard(cursor?: string, limit: number = 20) {
    const cacheKey = `leaderboard:india:${cursor || 'first'}:${limit}`;
    const cachedData = await this.cacheManager.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const data = await this.prisma.githubUser.findMany({
      where: { country: 'India' },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { score: 'desc' },
    });

    let nextCursor = null;
    if (data.length > limit) {
      const nextItem = data.pop();
      if (nextItem) nextCursor = nextItem.id;
    }

    const result = { data, nextCursor };
    await this.cacheManager.set(cacheKey, result, 600000);

    return result;
  }

  async getFriendsLeaderboard(userId: string, cursor?: string, limit: number = 20) {
    // Look up current user's github username
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true }
    });

    if (!currentUser) return { data: [], nextCursor: null };

    const username = currentUser.username;
    // 1. Check Redis cache for the final leaderboard data first!
    const cacheKey = `leaderboard:friends:${username}:${cursor || 'first'}:${limit}`;
    const cachedData = await this.cacheManager.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    // 2. Fetch Network
    const cacheKeyNetwork = `github_network:${username}`;
    let usernames: string[] = await this.cacheManager.get(cacheKeyNetwork) || [];

    if (!usernames || usernames.length === 0) {
      // Fetch directly from github API
      const [following, followers] = await Promise.all([
        this.githubSync.fetchNetwork(username, undefined, 'following', 50),
        this.githubSync.fetchNetwork(username, undefined, 'followers', 50)
      ]);
      
      usernames = Array.from(new Set([...following, ...followers]));
      // Cache network for 24 hours (86,400,000 ms)
      await this.cacheManager.set(cacheKeyNetwork, usernames, 86400000);
      
      // Dispatch sync jobs for friends so they eventually show up in github_users table
      usernames.forEach(friend => {
        this.syncQueue.add('sync-user', { username: friend });
      });
    }

    if (usernames.length === 0) return { data: [], nextCursor: null };

    const data = await this.prisma.githubUser.findMany({
      where: { username: { in: usernames } },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { score: 'desc' },
    });

    let nextCursor = null;
    if (data.length > limit) {
      const nextItem = data.pop();
      if (nextItem) nextCursor = nextItem.id;
    }

    const result = { data, nextCursor };

    // 4. Cache final result for 24 hours ONLY if we actually got data back
    // (If data is empty, it means BullMQ is still fetching, so we don't cache the empty result for 24 hours!)
    if (data.length > 0) {
      await this.cacheManager.set(cacheKey, result, 86400000);
    }

    return result; 
  }

  /**
   * Called when a user searches for a profile.
   * Checks if user exists and is fresh. If not, dispatches a background job.
   */
  async searchProfile(username: string) {
    const user = await this.prisma.githubUser.findUnique({
      where: { username: username.toLowerCase() } // assuming normalized usernames
    });

    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    if (!user || user.lastSyncedAt < oneDayAgo) {
      // Trigger background sync
      this.logger.log(`Dispatching background sync for ${username}`);
      await this.syncQueue.add('sync-user', { username });
    }

    return user; 
  }
}
