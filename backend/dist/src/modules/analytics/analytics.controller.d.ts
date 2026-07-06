import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getPlatformStats(): Promise<{
        activeDevelopers: number;
        commitsAnalyzed: number;
        battlesFought: number;
        uptime: string;
    }>;
    getUserAnalytics(username: string): Promise<{
        stats: {
            id: string;
            updatedAt: Date;
            following: number;
            followers: number;
            userId: string;
            totalCommits: number;
            totalPRs: number;
            totalIssues: number;
            totalReviews: number;
            totalStars: number;
            totalForks: number;
            totalRepos: number;
            contributions: number;
            streak: number;
            longestStreak: number;
            avgCommitsPerDay: number;
            activeDays: number;
            contributionData: import("@prisma/client/runtime/library").JsonValue | null;
            commitActivity: import("@prisma/client/runtime/library").JsonValue | null;
        } | null;
        languages: {
            id: string;
            name: string;
            userId: string;
            color: string | null;
            percentage: number;
            linesOfCode: number;
            repos: number;
        }[];
    }>;
}
