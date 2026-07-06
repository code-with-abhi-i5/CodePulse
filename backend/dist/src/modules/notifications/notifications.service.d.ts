import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
export declare class NotificationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getUserNotifications(userId: string): Promise<{
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
    markAsRead(notificationId: string): Promise<{
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
    markAllAsRead(userId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    createNotification(data: {
        userId: string;
        type: NotificationType;
        title: string;
        message: string;
    }): Promise<{
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
}
