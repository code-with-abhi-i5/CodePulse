import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/challenges.dto';
export declare class ChallengesController {
    private readonly challengesService;
    constructor(challengesService: ChallengesService);
    getActiveChallenges(): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.ChallengeType;
        title: string;
        description: string;
        createdAt: Date;
        difficulty: import("@prisma/client").$Enums.Difficulty;
        xpReward: number;
        target: number;
        icon: string | null;
        category: string | null;
        expiresAt: Date;
    }[]>;
    getMyChallenges(): Promise<({
        challenge: {
            id: string;
            type: import("@prisma/client").$Enums.ChallengeType;
            title: string;
            description: string;
            createdAt: Date;
            difficulty: import("@prisma/client").$Enums.Difficulty;
            xpReward: number;
            target: number;
            icon: string | null;
            category: string | null;
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
        difficulty: import("@prisma/client").$Enums.Difficulty;
        xpReward: number;
        target: number;
        icon: string | null;
        category: string | null;
        expiresAt: Date;
    }>;
    triggerDailyChallenges(): Promise<{
        success: boolean;
        message: string;
    }>;
}
