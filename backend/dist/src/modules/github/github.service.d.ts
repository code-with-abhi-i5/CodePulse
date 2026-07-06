import { ConfigService } from '@nestjs/config';
export declare class GithubService {
    private configService;
    private readonly logger;
    constructor(configService: ConfigService);
    fetchUserData(username: string, accessToken: string): Promise<any>;
    fetchUserEvents(username: string, accessToken: string): Promise<any>;
}
