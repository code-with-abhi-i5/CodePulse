import { FriendsService } from './friends.service';
export declare class FriendsController {
    private readonly friendsService;
    constructor(friendsService: FriendsService);
    followUser(id: string): Promise<{
        createdAt: Date;
        followerId: string;
        followingId: string;
    }>;
    unfollowUser(id: string): Promise<{
        createdAt: Date;
        followerId: string;
        followingId: string;
    }>;
    getFollowers(id: string): Promise<({
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
    getFollowing(id: string): Promise<({
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
