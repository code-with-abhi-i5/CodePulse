import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async deleteUser(userId: string) {
    // In a real scenario, this might be a soft delete or require cascading cleanup
    return this.prisma.user.delete({
      where: { id: userId },
    });
  }

  async setMaintenanceMode(active: boolean) {
    // Usually stored in Redis or a settings table
    return { maintenanceMode: active, updatedAt: new Date() };
  }
}
