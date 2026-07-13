import { LeaderboardsService } from './leaderboards.service';
export declare class LeaderboardsController {
    private readonly leaderboardsService;
    constructor(leaderboardsService: LeaderboardsService);
    getGlobalLeaderboard(cursor?: string, limit?: string): Promise<{}>;
    getIndiaLeaderboard(cursor?: string, limit?: string): Promise<{}>;
    getFriendsLeaderboard(req: any, cursor?: string, limit?: string): Promise<{}>;
    getUserProfile(username: string): Promise<{
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
