import { PrismaService } from '../../prisma/prisma.service';
export declare class BadgesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAllBadges(): Promise<{
        id: string;
        name: string;
        description: string;
        tier: import("@prisma/client").$Enums.BadgeTier;
        icon: string | null;
        category: string | null;
    }[]>;
    getUserBadges(userId: string): Promise<({
        badge: {
            id: string;
            name: string;
            description: string;
            tier: import("@prisma/client").$Enums.BadgeTier;
            icon: string | null;
            category: string | null;
        };
    } & {
        id: string;
        userId: string;
        badgeId: string;
        earnedAt: Date;
    })[]>;
    awardBadge(userId: string, badgeId: string): Promise<{
        id: string;
        userId: string;
        badgeId: string;
        earnedAt: Date;
    }>;
}
