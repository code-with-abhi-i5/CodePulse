import { PrismaService } from '../../prisma/prisma.service';
export declare class AdminService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    deleteUser(userId: string): Promise<{
        id: string;
        githubId: string;
        username: string;
        name: string | null;
        avatar: string | null;
        bio: string | null;
        location: string | null;
        company: string | null;
        website: string | null;
        githubUrl: string | null;
        isOnline: boolean;
        joinedAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    setMaintenanceMode(active: boolean): Promise<{
        maintenanceMode: boolean;
        updatedAt: Date;
    }>;
}
