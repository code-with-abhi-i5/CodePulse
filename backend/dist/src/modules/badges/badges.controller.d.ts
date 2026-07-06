import { BadgesService } from './badges.service';
export declare class BadgesController {
    private readonly badgesService;
    constructor(badgesService: BadgesService);
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
