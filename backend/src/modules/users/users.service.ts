import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        rating: true,
        stats: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User @${username} not found`);
    }
    return user;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        rating: true,
        stats: true,
        languages: true,
        repositories: true,
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        badges: {
          include: { badge: true }
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }
    return user;
  }

  async updateProfile(userId: string, data: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }
}
