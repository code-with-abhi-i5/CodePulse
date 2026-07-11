import { ConfigService } from '@nestjs/config';
export declare class GithubSyncService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    fetchPublicStats(username: string, overrideToken?: string): Promise<{
        githubId: any;
        username: any;
        name: any;
        avatarUrl: any;
        bio: any;
        company: any;
        location: any;
        primaryLanguage: string | null;
        followers: any;
        following: any;
        publicRepos: any;
        totalStars: number;
        totalForks: number;
    } | null>;
    fetchNetwork(username: string, token?: string, type?: 'followers' | 'following', limit?: number): Promise<any>;
}
