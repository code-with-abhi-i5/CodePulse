import { PrismaService } from '../../prisma/prisma.service';
export declare class SettingsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getUserSettings(userId: string): Promise<{
        theme: string;
        notificationsEnabled: boolean;
        emailAlerts: boolean;
        privacy: string;
    }>;
    updateUserSettings(userId: string, settings: any): Promise<{
        updated: boolean;
        settings: any;
    }>;
}
