import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ChallengesService } from './challenges.service';
export declare class ChallengesWorker extends WorkerHost {
    private readonly challengesService;
    private readonly logger;
    constructor(challengesService: ChallengesService);
    process(job: Job<any, any, string>): Promise<any>;
}
