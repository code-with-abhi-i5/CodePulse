import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getSystemReport(): Promise<{
        systemStatus: string;
        metrics: {
            totalUsers: number;
            totalBattles: number;
            activeBattles: number;
            totalChallenges: number;
            activeChallenges: number;
        };
        timestamp: Date;
    }>;
}
