import { PrismaService } from '../../prisma/prisma.service';
import { CreateChallengeDto } from './dto/challenges.dto';
export declare class ChallengesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getActiveChallenges(): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.ChallengeType;
        title: string;
        description: string;
        createdAt: Date;
        icon: string | null;
        category: string | null;
        difficulty: import("@prisma/client").$Enums.Difficulty;
        xpReward: number;
        target: number;
        expiresAt: Date;
    }[]>;
    getUserChallenges(userId: string): Promise<({
        challenge: {
            id: string;
            type: import("@prisma/client").$Enums.ChallengeType;
            title: string;
            description: string;
            createdAt: Date;
            icon: string | null;
            category: string | null;
            difficulty: import("@prisma/client").$Enums.Difficulty;
            xpReward: number;
            target: number;
            expiresAt: Date;
        };
    } & {
        id: string;
        userId: string;
        challengeId: string;
        progress: number;
        isCompleted: boolean;
        completedAt: Date | null;
    })[]>;
    createChallenge(dto: CreateChallengeDto): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.ChallengeType;
        title: string;
        description: string;
        createdAt: Date;
        icon: string | null;
        category: string | null;
        difficulty: import("@prisma/client").$Enums.Difficulty;
        xpReward: number;
        target: number;
        expiresAt: Date;
    }>;
}
