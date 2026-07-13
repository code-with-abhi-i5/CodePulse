import { Queue } from 'bullmq';
export declare class ChallengesScheduler {
    private readonly challengesQueue;
    private readonly logger;
    constructor(challengesQueue: Queue);
    scheduleDailyChallenges(): Promise<void>;
}
