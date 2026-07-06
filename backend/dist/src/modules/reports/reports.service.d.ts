import { PrismaService } from '../../prisma/prisma.service';
export declare class ReportsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
