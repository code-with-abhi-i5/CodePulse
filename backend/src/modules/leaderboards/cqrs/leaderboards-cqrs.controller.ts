import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CommandBus } from './core/command-bus';
import { QueryBus } from './core/query-bus';
import { RecordMatchResultCommand } from './commands/record-match-result.command';
import { SyncUserCommitsCommand } from './commands/sync-user-commits.command';
import { GetTopDevelopersQuery } from './queries/get-top-developers.query';
import { GetCountryLeaderboardQuery } from './queries/get-country-leaderboard.query';
import { LeaderboardReconcilerService } from './reconciler/leaderboard-reconciler.service';

export class RecordMatchDto {
  matchId!: string;
  winnerId!: string;
  loserId!: string;
  winnerScoreDelta?: number;
  loserScoreDelta?: number;
  matchType?: string;
  metadata?: Record<string, any>;
}

export class SyncCommitsDto {
  userId!: string;
  newCommitsCount!: number;
  linesAdded?: number;
  repositoryName?: string;
  country?: string;
  commitHash?: string;
}

@ApiTags('Leaderboards CQRS')
@Controller('api/v1/leaderboards/cqrs')
export class LeaderboardsCqrsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly reconciler: LeaderboardReconcilerService,
  ) {}

  @Post('matches')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Command: Record match result (Postgres write-master with async projection)' })
  @ApiResponse({ status: 201, description: 'Match result recorded and state projected' })
  async recordMatch(@Body() dto: RecordMatchDto) {
    const command = new RecordMatchResultCommand(
      dto.matchId,
      dto.winnerId,
      dto.loserId,
      dto.winnerScoreDelta ?? 25,
      dto.loserScoreDelta ?? -15,
      dto.matchType ?? '1v1_RANKED',
      dto.metadata,
    );
    return this.commandBus.execute(command);
  }

  @Post('commits/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Command: Sync user commits (Postgres write-master with async projection)' })
  @ApiResponse({ status: 200, description: 'User commits synced and state projected' })
  async syncCommits(@Body() dto: SyncCommitsDto) {
    const command = new SyncUserCommitsCommand(
      dto.userId,
      dto.newCommitsCount,
      dto.linesAdded ?? 0,
      dto.repositoryName,
      dto.country,
      dto.commitHash,
    );
    return this.commandBus.execute(command);
  }

  @Get('top')
  @ApiOperation({ summary: 'Query: Get top developers (read exclusively from Redis ZSET read model < 5ms)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'metric', required: false, enum: ['rating', 'commits'] })
  async getTopDevelopers(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('metric') metric?: 'rating' | 'commits',
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    const query = new GetTopDevelopersQuery(parsedLimit, parsedOffset, metric || 'rating');
    return this.queryBus.execute(query);
  }

  @Get('country/:country')
  @ApiOperation({ summary: 'Query: Get country leaderboard (read exclusively from Redis ZSET read model < 5ms)' })
  @ApiParam({ name: 'country', description: 'Country name or code, e.g. India, US' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'metric', required: false, enum: ['rating', 'commits'] })
  async getCountryLeaderboard(
    @Param('country') country: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('metric') metric?: 'rating' | 'commits',
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    const query = new GetCountryLeaderboardQuery(country, parsedLimit, parsedOffset, metric || 'rating');
    return this.queryBus.execute(query);
  }

  @Post('reconcile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger on-demand self-healing reconciliation to repair drift' })
  async triggerReconcile() {
    return this.reconciler.reconcileLeaderboards();
  }

  @Get('reconcile/status')
  @ApiOperation({ summary: 'Get latest self-healing reconciliation audit report' })
  async getReconcileStatus() {
    const latest = this.reconciler.getLatestAuditReport();
    return {
      latest,
      historyCount: this.reconciler.getAuditHistory().length,
    };
  }
}
