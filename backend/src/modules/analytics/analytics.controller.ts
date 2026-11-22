import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  Optional,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgProductivityQueryDto } from './dto/org-metrics.dto';
import type { OrgBenchmarkReportDto } from './dto/org-metrics.dto';
import { ScyllaDbTelemetryService } from './scylladb-telemetry.service';
import type {
  KeystrokeTelemetryEvent,
  TelemetryBenchmarkResult,
  ScyllaEngineStats,
} from './scylladb-telemetry.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    @Optional() private readonly scyllaTelemetry?: ScyllaDbTelemetryService,
  ) {}

  @Get('platform')
  @ApiOperation({ summary: 'Get global platform statistics' })
  async getPlatformStats() {
    return this.analyticsService.getPlatformStats();
  }

  @Get('privacy-safe-aggregations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get differentially private platform statistics with epsilon budget accounting and cohort suppression',
  })
  async getPrivacySafeAggregations(
    @Request() req: { user: { id: string } },
    @Query('epsilon') epsilon?: string,
  ) {
    const parsedEpsilon = epsilon ? parseFloat(epsilon) : 1.0;
    return this.analyticsService.getPrivacySafeAggregations(
      req.user.id,
      parsedEpsilon,
    );
  }

  @Post('org/benchmark')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Generate differentially private organization productivity and benchmark report (#542)',
  })
  @ApiBody({ type: OrgProductivityQueryDto })
  async getOrgProductivityBenchmark(
    @Request() req: { user: { id: string } },
    @Body() query: OrgProductivityQueryDto,
  ): Promise<OrgBenchmarkReportDto> {
    return this.analyticsService.getOrgProductivityBenchmark(req.user.id, query);
  }

  @Get('privacy-budget/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Check current privacy loss budget consumption and remaining allocation (#542)',
  })
  async getPrivacyBudgetStatus(@Request() req: { user: { id: string } }) {
    return this.analyticsService.getPrivacyBudgetStatus(req.user.id);
  }

  @Get('user/:username')
  @ApiOperation({ summary: 'Get aggregated analytics for a specific user' })
  async getUserAnalytics(@Param('username') username: string) {
    return this.analyticsService.getUserAnalytics(username);
  }

  @Get('repository/:repositoryId/commit-punchcard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a repository commit punchcard in a requested timezone' })
  async getRepositoryCommitPunchcard(
    @Request() req: { user: { id: string } },
    @Param('repositoryId') repositoryId: string,
    @Query('timezone') timezone = 'UTC',
  ) {
    return this.analyticsService.getRepositoryCommitPunchcard(req.user.id, repositoryId, timezone);
  }

  // ==========================================
  // ScyllaDB Time-Series Telemetry Endpoints
  // ==========================================

  @Get('telemetry/stats')
  @ApiOperation({
    summary: 'Get ScyllaDB / Cassandra time-series telemetry engine stats & TWCS status',
  })
  getTelemetryStats(): ScyllaEngineStats | null {
    if (!this.scyllaTelemetry) return null;
    return this.scyllaTelemetry.getStats();
  }

  @Get('telemetry/benchmark')
  @ApiOperation({
    summary:
      'Benchmark ScyllaDB unlogged batch write throughput (validating 20,000+ events/sec & sub-5ms ack)',
  })
  @ApiQuery({ name: 'events', required: false, type: Number })
  async runTelemetryBenchmark(
    @Query('events') events?: string,
  ): Promise<TelemetryBenchmarkResult | null> {
    if (!this.scyllaTelemetry) return null;
    const count = events ? parseInt(events, 10) : 25000;
    return this.scyllaTelemetry.runWriteBenchmark(isNaN(count) ? 25000 : count);
  }

  @Get('telemetry/keystrokes/:battleId')
  @ApiOperation({
    summary: 'Stream ordered keystroke and cursor time-series events for battle replay',
  })
  @ApiParam({ name: 'battleId', description: 'Battle UUID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getBattleTelemetry(
    @Param('battleId') battleId: string,
    @Query('limit') limit?: string,
  ): Promise<KeystrokeTelemetryEvent[]> {
    if (!this.scyllaTelemetry) return [];
    const lim = limit ? parseInt(limit, 10) : undefined;
    return this.scyllaTelemetry.getBattleTimeline(battleId, { limit: lim });
  }

  @Post('telemetry/keystrokes/batch')
  @ApiOperation({
    summary: 'Asynchronously ingest unlogged batch of keystroke telemetry events',
  })
  @ApiBody({ description: 'Array of telemetry events' })
  async ingestTelemetryBatch(
    @Body() events: KeystrokeTelemetryEvent[],
  ): Promise<{ ingestedCount: number; ack: boolean }> {
    if (!this.scyllaTelemetry) return { ingestedCount: 0, ack: false };
    const count = this.scyllaTelemetry.recordTelemetryEventsBulk(events);
    return { ingestedCount: count, ack: true };
  }
}
