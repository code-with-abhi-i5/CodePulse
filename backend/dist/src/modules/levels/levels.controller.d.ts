import { LevelsService } from './levels.service';
export declare class LevelsController {
    private readonly levelsService;
    constructor(levelsService: LevelsService);
    checkLevelUp(userId: string): Promise<{
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
