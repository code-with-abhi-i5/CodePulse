import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    deleteUser(id: string): Promise<{
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
    toggleMaintenance(active: boolean): Promise<{
        maintenanceMode: boolean;
        updatedAt: Date;
    }>;
}
