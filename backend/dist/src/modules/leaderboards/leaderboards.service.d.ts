import { PrismaService } from '../../prisma/prisma.service';
export declare class LeaderboardsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getGlobalLeaderboard(limit?: number): Promise<({
        user: {
            id: string;
            username: string;
            name: string | null;
            avatar: string | null;
        };
    } & {
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
    })[]>;
    getLanguageLeaderboard(language: string, limit?: number): Promise<({
        user: {
            id: string;
            username: string;
            avatar: string | null;
        };
    } & {
        id: string;
        name: string;
        userId: string;
        color: string | null;
        percentage: number;
        linesOfCode: number;
        repos: number;
    })[]>;
}
