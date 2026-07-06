import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BadgesService } from './badges.service';

@ApiTags('badges')
@Controller('badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available badges' })
  async getAllBadges() {
    return this.badgesService.getAllBadges();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get badges earned by a user' })
  async getUserBadges(@Param('userId') userId: string) {
    return this.badgesService.getUserBadges(userId);
  }

  @Post('award/:userId/:badgeId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Award a badge to a user (Admin/Internal only)' })
  async awardBadge(@Param('userId') userId: string, @Param('badgeId') badgeId: string) {
    return this.badgesService.awardBadge(userId, badgeId);
  }
}
