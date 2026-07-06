import { PrismaService } from '../../prisma/prisma.service';
export declare class FriendsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    followUser(followerId: string, followingId: string): Promise<{
        createdAt: Date;
        followerId: string;
        followingId: string;
    }>;
    unfollowUser(followerId: string, followingId: string): Promise<{
        createdAt: Date;
        followerId: string;
        followingId: string;
    }>;
    getFollowers(userId: string): Promise<({
        follower: {
            id: string;
            username: string;
            avatar: string | null;
        };
    } & {
        createdAt: Date;
        followerId: string;
        followingId: string;
    })[]>;
    getFollowing(userId: string): Promise<({
        following: {
            id: string;
            username: string;
            avatar: string | null;
        };
    } & {
        createdAt: Date;
        followerId: string;
        followingId: string;
    })[]>;
}
