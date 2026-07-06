import { PrismaService } from '../../prisma/prisma.service';
export declare class LevelsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    checkAndLevelUp(userId: string): Promise<{
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
    }>;
}
