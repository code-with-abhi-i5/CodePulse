import { PrismaService } from '../../prisma/prisma.service';
import { AddXpDto } from './dto/xp.dto';
export declare class XpService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
