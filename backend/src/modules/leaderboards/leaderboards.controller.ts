import { Controller, Get, Query, Req, UseGuards, Param, ParseIntPipe } from '@nestjs/common';
import { LeaderboardsService } from './leaderboards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Leaderboards')
@Controller('leaderboards')
export class LeaderboardsController {
  constructor(private readonly leaderboardsService: LeaderboardsService) {}

  @Get('global')
  @ApiOperation({ summary: 'Get global leaderboard' })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getGlobalLeaderboard(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.leaderboardsService.getGlobalLeaderboard(cursor, parsedLimit);
  }

  @Get('india')
  @ApiOperation({ summary: 'Get India leaderboard' })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getIndiaLeaderboard(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.leaderboardsService.getIndiaLeaderboard(cursor, parsedLimit);
  }

  @Get('friends')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get friends leaderboard' })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getFriendsLeaderboard(
    @Req() req: any,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.leaderboardsService.getFriendsLeaderboard(req.user.id, cursor, parsedLimit);
  }

  @Get('user/:username')
  @ApiOperation({ summary: 'Search and get specific user profile stats' })
  async getUserProfile(@Param('username') username: string) {
    return this.leaderboardsService.searchProfile(username);
  }
}
