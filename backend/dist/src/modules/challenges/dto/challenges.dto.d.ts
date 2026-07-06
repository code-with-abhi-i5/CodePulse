import { ChallengeType, Difficulty } from '@prisma/client';
export declare class CreateChallengeDto {
    title: string;
    description: string;
    type: ChallengeType;
    difficulty: Difficulty;
    xpReward: number;
    target: number;
    icon?: string;
    category?: string;
    expiresAt: string;
}
