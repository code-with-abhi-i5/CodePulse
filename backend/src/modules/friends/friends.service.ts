import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

  async followUser(followerId: string, followingId: string) {
    return this.prisma.follows.create({
      data: {
        followerId,
        followingId,
      },
    });
  }

  async unfollowUser(followerId: string, followingId: string) {
    return this.prisma.follows.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
  }

  async getFollowers(userId: string) {
    return this.prisma.follows.findMany({
      where: { followingId: userId },
      include: { follower: { select: { id: true, username: true, avatar: true } } },
    });
  }

  async getFollowing(userId: string) {
    return this.prisma.follows.findMany({
      where: { followerId: userId },
      include: { following: { select: { id: true, username: true, avatar: true } } },
    });
  }
}
