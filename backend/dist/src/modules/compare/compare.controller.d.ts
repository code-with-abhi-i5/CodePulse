import { CompareService } from './compare.service';
import { CompareDevelopersDto } from './dto/compare.dto';
export declare class CompareController {
    private readonly compareService;
    constructor(compareService: CompareService);
    compare(query: CompareDevelopersDto): Promise<{
        developer1: {
            username: string;
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
            rating: {
                id: string;
                updatedAt: Date;
                userId: string;
                overall: number;
                level: number;
                xp: number;
                xpToNextLevel: number;
                rank: number;
                totalDevelopers: number;
                tier: import("@prisma/client").$Enums.Tier;
                growthScore: number;
            } | null;
        };
        developer2: {
            username: string;
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
            rating: {
                id: string;
                updatedAt: Date;
                userId: string;
                overall: number;
                level: number;
                xp: number;
                xpToNextLevel: number;
                rank: number;
                totalDevelopers: number;
                tier: import("@prisma/client").$Enums.Tier;
                growthScore: number;
            } | null;
        };
        comparison: {
            winner: string;
            scoreDiff: number;
        };
    }>;
}
