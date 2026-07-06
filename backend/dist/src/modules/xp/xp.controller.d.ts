import { XpService } from './xp.service';
import { AddXpDto } from './dto/xp.dto';
export declare class XpController {
    private readonly xpService;
    constructor(xpService: XpService);
    addXp(dto: AddXpDto): Promise<{
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
