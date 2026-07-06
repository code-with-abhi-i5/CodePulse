import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getMyNotifications(): Promise<{
        id: string;
        userId: string;
        type: import("@prisma/client").$Enums.NotificationType;
        title: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        icon: string | null;
        message: string;
        isRead: boolean;
        actionUrl: string | null;
    }[]>;
    markAsRead(id: string): Promise<{
        id: string;
        userId: string;
        type: import("@prisma/client").$Enums.NotificationType;
        title: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        icon: string | null;
        message: string;
        isRead: boolean;
        actionUrl: string | null;
    }>;
    markAllAsRead(): Promise<import("@prisma/client").Prisma.BatchPayload>;
}
