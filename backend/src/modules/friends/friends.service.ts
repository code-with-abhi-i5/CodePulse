import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DeveloperGraphService,
  GraphRecommendationResult,
} from '../graph/developer-graph.service';

@Injectable()
export class FriendsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    private readonly graphService?: DeveloperGraphService,
  ) {}

  async followUser(followerId: string, followingId: string) {
    const result = await this.prisma.follows.create({
      data: {
        followerId,
        followingId,
      },
    });

    // Asynchronously synchronize FOLLOWS edge in developer graph
    if (this.graphService) {
      void this.graphService
        .upsertFollowsEdge(followerId, followingId)
        .catch(() => {});
    }

    return result;
  }

  async unfollowUser(followerId: string, followingId: string) {
    const result = await this.prisma.follows.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (this.graphService) {
      void this.graphService
        .removeFollowsEdge(followerId, followingId)
        .catch(() => {});
    }

    return result;
  }

  async getGraphRecommendations(
    userId: string,
    limit = 10,
  ): Promise<GraphRecommendationResult[]> {
    if (this.graphService) {
      return this.graphService.getPeerRecommendations(userId, limit);
    }
    return [];
  }

  async getFollowers(userId: string) {
    return this.prisma.follows.findMany({
      where: { followingId: userId },
      include: {
        follower: { select: { id: true, username: true, avatar: true } },
      },
    });
  }

  async getFollowing(userId: string) {
    return this.prisma.follows.findMany({
      where: { followerId: userId },
      include: {
        following: { select: { id: true, username: true, avatar: true } },
      },
    });
  }

  /**
   * Queries chronological activities belonging to users that the specified user follows.
   */
  async getActivityFeed(userId: string, limit = 20, offset = 0) {
    const following = await this.prisma.follows.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);

    if (followingIds.length === 0) {
      return {
        items: [],
        total: 0,
        followingCount: 0,
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.activity.findMany({
        where: {
          userId: { in: followingIds },
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.activity.count({
        where: {
          userId: { in: followingIds },
        },
      }),
    ]);

    return {
      items,
      total,
      followingCount: followingIds.length,
    };
  }
}
