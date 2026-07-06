import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('platform')
  @ApiOperation({ summary: 'Get global platform statistics' })
  async getPlatformStats() {
    return this.analyticsService.getPlatformStats();
  }

  @Get('user/:username')
  @ApiOperation({ summary: 'Get aggregated analytics for a specific user' })
  async getUserAnalytics(@Param('username') username: string) {
    return this.analyticsService.getUserAnalytics(username);
  }
}
