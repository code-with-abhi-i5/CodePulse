import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VerifiableCredentialsService } from '../identity/verifiable-credentials.service';

@Injectable()
export class BadgesService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly vcService?: VerifiableCredentialsService,
  ) {}

  async getAllBadges() {
    return this.prisma.badge.findMany();
  }

  async getUserBadges(userId: string) {
    return this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
    });
  }

  async awardBadge(userId: string, badgeId: string) {
    const badge = await this.prisma.badge.findUnique({ where: { id: badgeId } });
    if (!badge) {
      throw new NotFoundException(`Badge ${badgeId} not found`);
    }

    const userBadge = await this.prisma.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId } },
      update: {},
      create: { userId, badgeId },
      include: { badge: true, user: true },
    });

    // Automatically issue W3C Verifiable Credential if vcService is available
    if (this.vcService) {
      try {
        await this.vcService.issueBadgeCredential(userId, badgeId);
      } catch {
        // Fall back gracefully if user record incomplete or deferred
      }
    }

    return userBadge;
  }

  async exportBadgeCredential(userId: string, badgeId: string) {
    if (!this.vcService) {
      throw new NotFoundException('VerifiableCredentialsService is not enabled');
    }
    return this.vcService.issueBadgeCredential(userId, badgeId);
  }
}

