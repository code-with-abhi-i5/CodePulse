import { PrismaService } from '../../prisma/prisma.service';
import { GithubService } from '../github/github.service';
export declare class SyncService {
    private readonly prisma;
    private readonly github;
    private readonly logger;
    constructor(prisma: PrismaService, github: GithubService);
    syncUserData(userId: string, username: string, accessToken: string): Promise<void>;
}
