import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LeaderboardsService } from './leaderboards.service';

@ApiTags('leaderboards')
@Controller('leaderboards')
export class LeaderboardsController {
  constructor(private readonly leaderboardsService: LeaderboardsService) {}

  @Get('global')
  @ApiOperation({ summary: 'Get global top developers based on overall rating' })
  async getGlobalLeaderboard(@Query('limit') limit?: number) {
    return this.leaderboardsService.getGlobalLeaderboard(limit ? Number(limit) : 100);
  }

  @Get('language')
  @ApiOperation({ summary: 'Get leaderboard for a specific programming language' })
  async getLanguageLeaderboard(@Query('language') language: string, @Query('limit') limit?: number) {
    return this.leaderboardsService.getLanguageLeaderboard(language, limit ? Number(limit) : 50);
  }
}
