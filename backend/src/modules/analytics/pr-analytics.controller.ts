import {
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrAnalyticsService } from './pr-analytics.service';
@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics/pr-velocity')
export class PrAnalyticsController {
  constructor(private readonly analytics: PrAnalyticsService) {}
  @Get()
  report(@Request() req: { user: { id: string } }) {
    return this.analytics.report(req.user.id);
  }
  @Post('refresh/:repositoryId')
  @Throttle({ default: { limit: 1, ttl: 3600000 } })
  refresh(
    @Request() req: { user: { id: string } },
    @Param('repositoryId') id: string,
  ) {
    return this.analytics.refresh(req.user.id, id);
  }
}
