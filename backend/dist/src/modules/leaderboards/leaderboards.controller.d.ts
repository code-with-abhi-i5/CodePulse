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
        avatarUrl: string | null;
        bio: string | null;
        company: string | null;
        location: string | null;
        country: string | null;
        primaryLanguage: string | null;
        followers: number;
        following: number;
        publicRepos: number;
        totalStars: number;
        totalForks: number;
        score: number;
        lastSyncedAt: Date;
        updatedAt: Date;
    } | null>;
}
